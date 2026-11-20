import { Request, Response } from 'express';
import { assistantSettings } from '../config/env';
import { askGemini } from '../lib/ai/gemini';
import { ChatTurn, REFUSAL_REPLY } from '../lib/assistantPrompt';
import { resolveLinks } from '../lib/assistantTools';
import { HttpError } from '../lib/http';

/*
 * Tanya Krida — asisten AI pengunjung (POST /api/assistant/chat).
 * Aplikasi mengirim riwayat percakapan (teks saja). Server memanggil Google Gemini dengan alat baca-saja
 * (lib/assistantTools.ts) sehingga jadwal, tarif, ketersediaan, dan materi budaya diambil dari database/materi
 * aplikasi, bukan dikarang. Kunci API hanya ada di server (.env).
 */
export const chat = async (req: Request, res: Response) => {
  const settings = assistantSettings();
  if (!settings.apiKey) {
    throw new HttpError(503, 'Tanya Krida belum diaktifkan di server. Hubungi pengelola TKBJ.');
  }
  const history = req.body.messages as ChatTurn[];
  const result = await askGemini(history, { apiKey: settings.apiKey, model: settings.model, log: req.log });

  if (result.refused) {
    req.log?.warn({ ai: result.meta }, 'Tanya Krida: permintaan ditolak model');
    return res.json({ reply: REFUSAL_REPLY, links: [], suggestions: [] });
  }
  req.log?.info({ ai: result.meta }, 'Tanya Krida menjawab');
  const { answer } = result;
  res.json({
    reply: answer.jawaban || 'Maaf, Tanya Krida belum bisa menjawab. Coba ulangi pertanyaanmu.',
    links: await resolveLinks(answer.tautan),
    suggestions: answer.saran_pertanyaan
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
      .slice(0, 3)
      .map((s) => s.trim().slice(0, 80)),
  });
};
