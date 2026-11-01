import type { User } from '../models/userModel';
import type { RoleKey } from '../lib/roles';

/** Pengguna terverifikasi yang dipasang authMiddleware pada `req.user`. */
export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: RoleKey | null;
  /** ID sesi login (tabel sessions) milik token yang sedang dipakai. */
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
      user: User;
      sessionId: string;
    }
  }
}
