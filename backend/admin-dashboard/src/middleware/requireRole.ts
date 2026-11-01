import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/http';
import { canChange, canView, ModuleKey, moduleLabel, RoleKey, roleLabel } from '../lib/roles';

/*
 * Otorisasi (RBAC). Dipasang setelah authMiddleware, membaca peran dari req.user yang sudah diverifikasi
 * (bukan dari body/query klien). Tanpa req.user → 401; peran tidak sesuai → 403.
 */

const roleOf = (req: Request, next: NextFunction) => {
  if (!req.user) {
    next(new HttpError(401, 'Silakan login terlebih dahulu.'));
    return undefined;
  }
  return req.user.role;
};

/** Hanya peran tertentu, mis. `requireRole('admin')` untuk route Pengguna & Pengaturan. */
export const requireRole =
  (...roles: RoleKey[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const role = roleOf(req, next);
    if (role === undefined) return;
    if (role && roles.includes(role)) return next();
    next(new HttpError(403, `Peran ${roleLabel(role)} tidak memiliki akses. Khusus ${roles.map(roleLabel).join(', ')}.`));
  };

/** Peran harus boleh melihat modul ini menurut matriks lib/roles.ts ("y" atau "p"); "n" → 403. */
export const requireView = (module: ModuleKey) => (req: Request, _res: Response, next: NextFunction) => {
  const role = roleOf(req, next);
  if (role === undefined) return;
  if (canView(role, module)) return next();
  next(new HttpError(403, `Peran ${roleLabel(role)} tidak memiliki akses ke modul ${moduleLabel(module)}.`));
};

/** Hanya peran dengan akses ubah ("y") pada modul ini. */
export const requireAccess = (module: ModuleKey) => (req: Request, _res: Response, next: NextFunction) => {
  const role = roleOf(req, next);
  if (role === undefined) return;
  if (canChange(role, module)) return next();
  next(new HttpError(403, `Peran ${roleLabel(role)} tidak memiliki akses untuk tindakan ini.`));
};
