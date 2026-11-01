import { Router } from 'express';
import * as auth from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter';
import { validateLogin, validatePasswordChange, validateProfile, validateRegister } from '../middleware/validator';

/*
 * Endpoint autentikasi pengunjung, dipasang di /api/auth (lihat app.ts):
 *   POST /api/auth/register   publik — daftar & langsung masuk (JWT)
 *   POST /api/auth/login      publik — terbitkan JWT
 *   POST /api/auth/logout     wajib login — cabut sesi token
 *   GET  /api/auth/me         wajib login — profil & ringkasan akun
 *   PUT  /api/auth/me         wajib login — edit profil
 *   PUT  /api/auth/password   wajib login — ganti kata sandi
 * Urutan middleware: pembatas percobaan → validasi input → (verifikasi token) → controller.
 */
const router = Router();

router.post('/register', registerLimiter, validateRegister, auth.register);
router.post('/login', loginLimiter, validateLogin, auth.login);
router.post('/logout', authMiddleware, auth.logout);
router.get('/me', authMiddleware, auth.me);
router.put('/me', authMiddleware, validateProfile, auth.updateProfile);
router.put('/password', authMiddleware, validatePasswordChange, auth.changePassword);

export default router;
