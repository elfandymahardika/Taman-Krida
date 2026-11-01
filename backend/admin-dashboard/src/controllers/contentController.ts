import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import { assertValid, notFound } from '../lib/http';
import { createContent, findContentById, listContents, toContent, updateContent } from '../models/contentModel';

const STATUS_VERB: Record<string, string> = { Terpublikasi: 'diterbitkan', Terjadwal: 'dijadwalkan', Draf: 'disimpan sebagai draf' };

/** Konten aplikasi publik. Banner beranda = baris dengan `isHero`. */
export const getContents = async (_req: Request, res: Response) => {
  res.json((await listContents()).map(toContent));
};

/** Data sudah divalidasi validateContent → req.body.content. */
export const addContent = async (req: Request, res: Response) => {
  const data = req.body.content;
  const id = `c${Date.now().toString(36)}${randomBytes(2).toString('hex')}`;
  await createContent({ id, title: data.title, type: data.type, author: res.locals.user.name, summary: data.summary || null });
  await logActivity('content', 'Konten baru dibuat', `${res.locals.user.name} · ${data.title}`);
  res.status(201).json(toContent((await findContentById(id))!));
};

/** Perubahan sebagian (validateContentUpdate). Banner beranda yang terbit wajib punya teks tombol. */
export const editContent = async (req: Request<{ id: string }>, res: Response) => {
  const current = await findContentById(req.params.id);
  if (!current) throw notFound('Konten');
  const data = req.body.content;
  if (current.is_hero && data.status === 'Terpublikasi' && !(data.cta ?? current.cta))
    assertValid({ cta: 'Banner beranda yang terbit wajib punya teks tombol.' });

  const next = { ...toContent(current), ...data };
  await updateContent(current.id, {
    title: next.title,
    type: next.type,
    status: next.status,
    summary: next.summary || null,
    body: next.body || null,
    cta: next.cta || null,
    link: next.link || null,
    author: res.locals.user.name,
  });
  const what = current.is_hero ? 'Banner beranda' : 'Konten';
  await logActivity('content', `${what} ${STATUS_VERB[next.status]}`, `${res.locals.user.name} · ${next.title}`);
  res.json(toContent((await findContentById(current.id))!));
};
