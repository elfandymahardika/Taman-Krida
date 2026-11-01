import { Router } from 'express';
import * as auth from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter';
import { validateLogin, validateRegister } from '../middleware/validator';

/*
 * Endpoint autentikasi staf, dipasang di /api/auth (lihat app.ts):
 *   POST /api/auth/register  publik — pendaftaran staf (menunggu persetujuan admin)
 *   POST /api/auth/login     publik — terbitkan JWT
 *   POST /api/auth/logout    wajib login — cabut sesi token
 *   GET  /api/auth/me        wajib login — profil & hak akses
 * Urutan middleware: pembatas percobaan → validasi input → (verifikasi token) → controller.
 */
const router = Router();

router.post('/register', registerLimiter, validateRegister, auth.register);
router.post('/login', loginLimiter, validateLogin, auth.login);
router.post('/logout', authMiddleware, auth.logout);
router.get('/me', authMiddleware, auth.me);

export default router;
