import { Request, Response } from 'express';
import { HttpError, notFound } from '../lib/http';
import { createNote, deleteNote, findNote, listAllNotes, listNotesByUser, setNoteStatus, toNote, updateNote } from '../models/noteModel';

/*
 * Catatan staf (Modul 02). Aturan akses:
 * - Staf: membuat, membaca, mengubah, dan menghapus catatan MILIKNYA SENDIRI.
 * - Administrator utama: boleh melihat & mengubah semua catatan (supervisi), dan mengarsipkan catatan siapa pun.
 * userId selalu diambil dari sesi login (res.locals.userId), tidak pernah dari body/form.
 */

const isAdmin = (res: Response) => res.locals.user.role_key === 'admin';

/** Filter pemilik untuk query: admin tanpa filter (null), staf lain = ID-nya sendiri. */
const ownerFilter = (res: Response) => (isAdmin(res) ? null : res.locals.userId);

/** Catatan milik sendiri; admin dengan ?scope=all melihat semua catatan staf. */
export const getNotes = async (req: Request, res: Response) => {
  const rows = isAdmin(res) && req.query.scope === 'all' ? await listAllNotes() : await listNotesByUser(res.locals.userId);
  res.json(rows.map(toNote));
};

/** Data sudah divalidasi validateNote. */
export const addNote = async (req: Request, res: Response) => {
  const { title, content, status } = req.body;
  const id = await createNote(res.locals.userId, { title, content, status });
  res.status(201).json(toNote((await findNote(id, null))!));
};

export const editNote = async (req: Request<{ id: string }>, res: Response) => {
  const { title, content, status } = req.body;
  // WHERE id = ? AND user_id = ? — catatan milik orang lain dianggap tidak ada (404), bukan 403,
  // agar tidak membocorkan ID catatan yang ada.
  const changed = await updateNote(Number(req.params.id), ownerFilter(res), { title, content, status });
  if (!changed) throw notFound('Catatan');
  res.json(toNote((await findNote(Number(req.params.id), null))!));
};

export const removeNote = async (req: Request<{ id: string }>, res: Response) => {
  const deleted = await deleteNote(Number(req.params.id), ownerFilter(res));
  if (!deleted) throw notFound('Catatan');
  res.status(204).end();
};

/** Aksi khusus admin: arsipkan catatan staf mana pun (moderasi). */
export const archiveNote = async (req: Request<{ id: string }>, res: Response) => {
  if (!isAdmin(res)) throw new HttpError(403, 'FORBIDDEN: tindakan ini hanya boleh dilakukan Administrator utama.');
  const changed = await setNoteStatus(Number(req.params.id), 'Diarsipkan');
  if (!changed) throw notFound('Catatan');
  res.json(toNote((await findNote(Number(req.params.id), null))!));
};
