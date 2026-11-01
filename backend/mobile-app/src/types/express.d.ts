import type { Visitor } from '../models/visitorModel';

/** Pengunjung terverifikasi yang dipasang authMiddleware pada `req.user`. */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  /** Pengunjung aplikasi tidak punya peran staf; selalu "visitor". */
  role: 'visitor';
  /** ID sesi login (tabel visitor_sessions) milik token yang sedang dipakai. */
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Diisi authMiddleware setelah token & sesi diverifikasi. Kosong pada rute publik. */
      user?: AuthUser;
    }

    /** Standar Modul 01 PBL: ID pengguna di res.locals.userId (tetap diisi untuk controller lama). */
    interface Locals {
      userId: number;
      visitor: Visitor;
      sessionId: string;
    }
  }
}
