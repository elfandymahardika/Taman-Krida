import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { healthCheck } from './lib/health';
import apiRoutes from './routes/api';
import authRoutes from './routes/authRoutes';

/*
 * Urutan middleware (penting): request logger → Helmet → CORS → rate limiter → parser body → routes
 * → handler 404 → error handler. Express 5: error/promise yang ditolak di handler async otomatis
 * diteruskan ke error handler, jadi controller cukup `throw` (tidak perlu try/catch + next(err) seperti Express 4).
 */
const app: Application = express();
app.disable('x-powered-by');

// Di belakang Ngrok: percayai X-Forwarded-For sesuai TRUST_PROXY agar req.ip (kunci rate limiter & log)
// = IP pengguna, bukan IP proxy. Lihat config/env.ts.
app.set('trust proxy', config.trustProxy);

// 1. Logger permintaan paling awal: semua permintaan (termasuk yang ditolak 401/404/429) tercatat dengan request ID.
app.use(requestLogger);

// 2. Header keamanan (X-Content-Type-Options, X-Frame-Options, CSP, HSTS, dst.). CORP `cross-origin` agar
//    Flutter web di origin lain tetap bisa memuat berkas unduhan.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// 3. CORS (hanya untuk Flutter web; aplikasi Android/iOS tidak terkena CORS). Token dikirim lewat header
//    Authorization (bukan cookie), jadi tanpa `credentials`. CORS_ORIGINS kosong = semua origin saat development,
//    dan tidak ada origin browser di production. Dipasang sebelum rate limiter agar respons 429 tetap terbaca.
app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : config.isProduction ? false : '*',
    exposedHeaders: ['Content-Disposition', 'X-Request-Id', 'Retry-After'],
  }),
);

// Health check (Docker HEALTHCHECK, Nginx, skrip deploy): di luar /api agar tidak terkena rate limiter.
// Mengecek koneksi MySQL; 503 bila database putus atau server sedang graceful shutdown. Lihat lib/health.ts.
app.get('/health', healthCheck);

// 4. Pembatas umum semua rute /api (login & registrasi punya batas lebih ketat di authRoutes.ts).
app.use('/api', apiLimiter);

// 5. Parser body
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

// 6. Rute dari authRoutes.ts & api.ts. Berkas unggahan pengunjung TIDAK disajikan statis (lihat GET /api/files/:id).
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Endpoint Health Check
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Backend Express API aplikasi mobile TKBJ (TypeScript) siap digunakan!',
  });
});

// 7. Rute tidak dikenal → 404, lalu 8. error handler paling akhir.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
