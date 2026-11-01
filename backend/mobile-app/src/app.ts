import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRoutes from './routes/api';
import authRoutes from './routes/authRoutes';

const app: Application = express();
app.disable('x-powered-by');

// Aplikasi Android/iOS tidak terkena CORS; ini untuk Flutter web. Token dikirim lewat header Authorization
// (bukan cookie), jadi tanpa `credentials`. CORS_ORIGINS kosong = semua origin boleh.
app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : '*',
    exposedHeaders: ['Content-Disposition'],
  }),
);

// Konfigurasi Middlewares Express
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

// Menyambungkan rute dari api.ts. Berkas unggahan pengunjung TIDAK disajikan statis (lihat GET /api/files/:id).
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Endpoint Health Check
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Backend Express API aplikasi mobile TKBJ (TypeScript) siap digunakan!',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
