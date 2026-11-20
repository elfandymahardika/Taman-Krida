import { ApiError, Content, FunctionCall, FunctionCallingConfigMode, GoogleGenAI, Part } from '@google/genai';
import type { Logger } from 'pino';
import { ANSWER_SCHEMA, buildSystemPrompt, ChatTurn, MAX_ROUNDS, ProviderResult, toAnswer } from '../assistantPrompt';
import { runTool, toolSpecs } from '../assistantTools';
import { HttpError } from '../http';

/*
 * Tanya Krida memakai Google Gemini (SDK resmi @google/genai, kunci GEMINI_API_KEY dari Google AI Studio).
 * Alur function calling: model memanggil alat → server menjalankan query → hasilnya dikirim balik → berulang
 * sampai model memanggil `kirim_jawaban` (jawaban akhir terstruktur).
 */

/** Alat penutup: model menyerahkan jawaban akhir lewat parameter alat ini (bentuk = ANSWER_SCHEMA). */
const FINAL_TOOL = 'kirim_jawaban';

const SYSTEM_PROMPT = buildSystemPrompt(
  `Setelah data cukup, serahkan jawaban akhir dengan memanggil alat "${FINAL_TOOL}" (jangan menulis jawaban sebagai teks biasa).`,
);

const functionDeclarations = [
  ...toolSpecs.map((t) => ({ name: t.name, description: t.description, parametersJsonSchema: t.parameters })),
  { name: FINAL_TOOL, description: 'Kirim jawaban akhir untuk pengguna beserta tombol dan saran pertanyaan.', parametersJsonSchema: ANSWER_SCHEMA },
];

/** Alasan berhenti yang berarti jawaban diblokir pengaman model. */
const BLOCKED = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION', 'IMAGE_SAFETY']);

export async function askGemini(history: ChatTurn[], opts: { apiKey: string; model: string; log?: Logger }): Promise<ProviderResult> {
  const ai = new GoogleGenAI({
    apiKey: opts.apiKey,
    // GEMINI_BASE_URL hanya untuk test (server tiruan); kosong = server Google.
    httpOptions: { timeout: 60_000, ...(process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : {}) },
  });
  const contents: Content[] = history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
  const toolsUsed: string[] = [];
  const usage = { input: 0, output: 0 };

  for (let round = 1; ; round++) {
    const last = round >= MAX_ROUNDS;
    let response;
    try {
      response = await ai.models.generateContent({
        model: opts.model,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations }],
          // Putaran terakhir: model wajib langsung menyerahkan jawaban.
          toolConfig: {
            functionCallingConfig: last
              ? { mode: FunctionCallingConfigMode.ANY, allowedFunctionNames: [FINAL_TOOL] }
              : { mode: FunctionCallingConfigMode.AUTO },
          },
        },
      });
    } catch (error) {
      throw toHttpError(error, opts.log);
    }
    usage.input += response.usageMetadata?.promptTokenCount ?? 0;
    usage.output += response.usageMetadata?.candidatesTokenCount ?? 0;
    const meta = { provider: 'gemini', model: opts.model, rounds: round, tools: toolsUsed, usage };

    const candidate = response.candidates?.[0];
    if (response.promptFeedback?.blockReason || (candidate?.finishReason && BLOCKED.has(candidate.finishReason))) {
      return { refused: true, meta: { ...meta, reason: response.promptFeedback?.blockReason ?? candidate?.finishReason } };
    }

    const calls: FunctionCall[] = response.functionCalls ?? [];
    const final = calls.find((c) => c.name === FINAL_TOOL);
    const dataCalls = calls.filter((c) => c.name !== FINAL_TOOL);

    if (final && !dataCalls.length) return { refused: false, answer: toAnswer(final.args), meta };

    if (dataCalls.length && candidate?.content && !last) {
      // Isi respons model dikembalikan utuh (termasuk thought signature yang diwajibkan model Gemini 3).
      contents.push(candidate.content);
      const parts: Part[] = await Promise.all(
        calls.map(async (call): Promise<Part> => {
          const name = call.name ?? '';
          if (name === FINAL_TOOL) {
            return { functionResponse: { id: call.id, name, response: { error: 'Baca dulu hasil alat lain, lalu panggil kirim_jawaban lagi.' } } };
          }
          toolsUsed.push(name);
          try {
            const { data, isError } = await runTool(name, call.args);
            return { functionResponse: { id: call.id, name, response: isError ? { error: data } : { output: data } } };
          } catch (error) {
            opts.log?.error({ err: error, tool: name }, 'Tanya Krida: alat gagal');
            return { functionResponse: { id: call.id, name, response: { error: 'Data sedang tidak dapat diambil.' } } };
          }
        }),
      );
      contents.push({ role: 'user', parts });
      continue;
    }

    // Model menjawab dengan teks biasa (tanpa kirim_jawaban): tetap dipakai, tanpa tombol.
    return { refused: false, answer: toAnswer(response.text ?? ''), meta };
  }
}

/** Error SDK Gemini → pesan yang aman untuk pengguna. Detail asli hanya masuk log. */
function toHttpError(error: unknown, log?: Logger): HttpError {
  log?.error({ err: error }, 'Tanya Krida: panggilan API Gemini gagal');
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return new HttpError(429, 'Kuota Tanya Krida sedang habis. Coba lagi beberapa saat lagi.');
    }
    if (error.status === 401 || error.status === 403 || (error.status === 400 && /api.?key/i.test(error.message))) {
      return new HttpError(503, 'Tanya Krida belum dikonfigurasi dengan benar di server.');
    }
    return new HttpError(502, 'Tanya Krida sedang mengalami gangguan. Coba lagi nanti.');
  }
  // Selain ApiError: koneksi gagal / waktu habis.
  return new HttpError(503, 'Tanya Krida tidak dapat terhubung ke layanan AI. Coba lagi nanti.');
}
