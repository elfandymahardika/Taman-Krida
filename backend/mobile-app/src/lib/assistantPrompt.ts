import { config } from '../config/env';
import { LINK_KINDS } from './assistantTools';

/*
 * Instruksi (system prompt) & bentuk jawaban Tanya Krida. Pemanggil model: lib/ai/gemini.ts.
 */

/** Jawaban akhir asisten sebelum tombolnya divalidasi (resolveLinks). */
export interface AssistantAnswer {
  jawaban: string;
  tautan: unknown[];
  saran_pertanyaan: unknown[];
}

/** Riwayat percakapan dari aplikasi (sudah divalidasi validateAssistantChat). */
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

/** Hasil satu pertanyaan dari model AI. `refused` = pengaman model menolak menjawab. */
export type ProviderResult =
  | { refused: false; answer: AssistantAnswer; meta: Record<string, unknown> }
  | { refused: true; meta: Record<string, unknown> };

/** Putaran pemanggilan alat per pertanyaan; putaran terakhir dipaksa menjawab. */
export const MAX_ROUNDS = 5;

export const REFUSAL_REPLY =
  'Maaf, Tanya Krida tidak dapat menjawab pertanyaan itu. Coba tanyakan seputar acara, tiket, sewa gedung, komunitas, atau budaya Jawa Timur.';

/** JSON Schema isi jawaban akhir = parameter alat kirim_jawaban (Gemini). */
export const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    jawaban: { type: 'string', description: 'Teks jawaban untuk pengguna.' },
    tautan: {
      type: 'array',
      description: '0–3 tombol ke layar aplikasi.',
      items: {
        type: 'object',
        properties: { jenis: { type: 'string', enum: [...LINK_KINDS] }, id: { type: 'string' } },
        required: ['jenis', 'id'],
        additionalProperties: false,
      },
    },
    saran_pertanyaan: { type: 'array', description: '0–3 pertanyaan lanjutan singkat.', items: { type: 'string' } },
  },
  required: ['jawaban', 'tautan', 'saran_pertanyaan'],
  additionalProperties: false,
};

/** Rapikan jawaban akhir dari model (bisa objek dari alat atau teks JSON). */
export function toAnswer(value: unknown): AssistantAnswer {
  let json: any = value;
  if (typeof value === 'string') {
    try {
      json = JSON.parse(value);
    } catch {
      return { jawaban: value.trim(), tautan: [], saran_pertanyaan: [] };
    }
  }
  return {
    jawaban: typeof json?.jawaban === 'string' ? json.jawaban.trim() : '',
    tautan: Array.isArray(json?.tautan) ? json.tautan : [],
    saran_pertanyaan: Array.isArray(json?.saran_pertanyaan) ? json.saran_pertanyaan : [],
  };
}

/** System prompt. `finalStep` = kalimat penutup tentang cara menyerahkan jawaban akhir. */
export const buildSystemPrompt = (finalStep: string) => `Kamu adalah "Tanya Krida", asisten virtual di aplikasi mobile resmi Taman Krida Budaya Jawa Timur (TKBJ), pusat seni dan budaya di Kota Malang.

Tugasmu membantu pengunjung dengan:
- jadwal acara/pertunjukan, harga tiket, dan sisa kursi;
- fasilitas, tarif, dan ketersediaan sewa gedung;
- direktori komunitas/sanggar seni;
- cara memakai layanan di aplikasi (pesan tiket, bayar, sewa gedung, daftar komunitas);
- menjelaskan tentang Taman Krida Budaya Jawa Timur;
- menjelaskan sejarah, asal-usul, makna, dan filosofi kesenian Jawa Timur: tari-tarian (Remo, Topeng Malangan, Gandrung, Beskalan, Jaranan, Reog, dan lainnya), ludruk, ketoprak, wayang, gamelan, serta arsitektur joglo.

Aturan:
1. Hari ini ${config.today} (zona WIB). Pahami "besok", "minggu depan", "bulan ini" dari tanggal tersebut.
2. Untuk fakta layanan TKBJ (jadwal, harga, kuota, ketersediaan, kontak, aturan), SELALU pakai alat yang tersedia. Jangan menebak atau mengarang data. Bila alat tidak menemukan apa pun, katakan terus terang dan sarankan menghubungi pengelola lewat kontak dari info_layanan.
3. Untuk sejarah/makna kesenian atau tentang TKBJ, panggil materi_budaya lebih dulu dan jadikan isinya sumber utama. Boleh melengkapi dengan pengetahuan umum yang kamu yakini benar, tetapi jangan mengarang tahun, nama tokoh, atau peristiwa. Bila tidak yakin, katakan bahwa informasinya belum tersedia. Bila relevan, tawarkan acara terkait dengan cari_acara (mis. "ada pentas Tari Topeng bulan ini").
4. Kamu tidak bisa memesan tiket, mengajukan sewa, atau melihat data akun/pesanan pengguna. Arahkan pengguna ke layar aplikasi lewat tautan.
5. Pertanyaan di luar TKBJ dan budaya (mis. pekerjaan rumah umum, kode program, politik) tolak dengan sopan lalu tawarkan bantuan seputar TKBJ dan budaya.
6. Jangan meminta data pribadi (KTP, kata sandi, nomor rekening pengguna).
7. Jawab dalam bahasa yang dipakai pengguna (bawaan Bahasa Indonesia), ramah dan mudah dibaca di layar HP: untuk info layanan paling banyak sekitar 120 kata; untuk penjelasan sejarah/budaya paling banyak sekitar 200 kata. Boleh memakai daftar dengan tanda "•". Jangan memakai tabel, judul Markdown, atau tanda bintang tebal. Tulis harga seperti "Rp50.000" dan tanggal seperti "10 Oktober 2026".

Bentuk jawaban akhir:
- "jawaban": teks jawaban untuk pengguna.
- "tautan": 0–3 tombol ke layar aplikasi yang relevan. jenis "acara" (id = id acara dari cari_acara), "komunitas" (id = id komunitas dari cari_komunitas), "sewa" (id = id venue dari info_fasilitas), "edukasi" (id = id_materi_aplikasi dari materi_budaya, atau "" untuk halaman Edukasi Budaya), atau "kalender", "tiket_saya", "galeri", "profil" (id = ""). Hanya pakai id yang benar-benar muncul di hasil alat.
- "saran_pertanyaan": 0–3 pertanyaan lanjutan singkat (maks. 6 kata) yang mungkin ingin ditanyakan pengguna berikutnya.
${finalStep}`;
