import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import pinoHttp from 'pino-http';
import { logger } from '../logger';

/** Request ID dari klien/proxy (header X-Request-Id) dipakai ulang hanya bila formatnya aman; selain itu dibuat baru. */
const VALID_REQUEST_ID = /^[\w.-]{1,64}$/;

/** Path tanpa query string: query bisa berisi kata kunci pencarian atau data pribadi, jadi tidak dicatat. */
const pathOf = (url = '') => url.split('?')[0];

/**
 * Logger permintaan, dipasang PALING AWAL di app.ts. Satu baris log per permintaan berisi
 * requestId, method, path, status, dan durasi (responseTime, ms). Header (Authorization, Cookie) dan body
 * (password) sengaja tidak dicatat.
 *
 * Request ID dikirim balik di header `X-Request-Id`, ikut di setiap respons error (`requestId`, lihat errorHandler.ts),
 * dan menempel di semua log lewat `req.log`, sehingga satu kejadian bisa ditelusuri dari layar pengguna sampai log server.
 * `base` dapat diganti (mis. logger ke memori di test).
 */
export const createRequestLogger = (base: Logger) =>
  pinoHttp<Request, Response>({
    logger: base,
    quietReqLogger: true,
    // Probe GET /health dari Docker/Nginx berjalan tiap beberapa detik; yang gagal tetap tercatat oleh lib/health.ts.
    autoLogging: { ignore: (req) => pathOf(req.url) === '/health' },
    customAttributeKeys: { reqId: 'requestId' },
    genReqId: (req, res) => {
      const incoming = req.headers['x-request-id'];
      const id = typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    serializers: {
      req: (req) => ({ method: req.method, path: pathOf(req.url) }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    // 2xx/3xx = info, 4xx = warn (input salah, akses ditolak), 5xx = error (detail + stack ada di field `err`).
    customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    customSuccessMessage: (req, res, ms) => `${req.method} ${pathOf(req.originalUrl)} ${res.statusCode} ${ms}ms`,
    customErrorMessage: (req, res, err) => `${req.method} ${pathOf(req.originalUrl)} ${res.statusCode} — ${err.message}`,
  });

export const requestLogger = createRequestLogger(logger);
