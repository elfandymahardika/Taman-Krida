import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRoutes from './routes/api';
import authRoutes from './routes/authRoutes';

const app: Application = express();
app.disable('x-powered-by');

// Pasang middleware CORS sebelum route API. Origin diambil dari FRONTEND_URL (bisa lebih dari satu, pisahkan koma)
// agar frontend rekan tim (mis. lewat Ngrok) boleh memanggil API.
app.use(
  cors({
    origin: config.frontendUrls,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  }),
);

// Konfigurasi Middlewares Express
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

// Berkas galeri & dokumen disajikan statis di /uploads (nama file acak). `nosniff` mencegah browser
// menafsirkan berkas sebagai tipe lain (mis. HTML) selain Content-Type-nya.
app.use(
  '/uploads',
  express.static(config.uploadsDir, {
    fallthrough: false,
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }),
);

// Menyambungkan rute: /api/auth (authRoutes.ts) lalu rute lain (api.ts)
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Endpoint Health Check
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Backend Express API (TypeScript) siap digunakan!',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
