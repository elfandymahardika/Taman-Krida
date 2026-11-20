import pino, { LoggerOptions } from 'pino';

/*
 * Logger terstruktur aplikasi (pino, format JSON satu baris per kejadian).
 * - Level dari LOG_LEVEL (bawaan `info`; test memakai `silent`, lihat test/env.ts).
 * - Development + terminal: dicetak rapi lewat pino-pretty. Production: JSON mentah agar mudah dikumpulkan.
 * - `redact` = jaring pengaman: bila suatu log tidak sengaja menyertakan password, token, cookie, atau header
 *   Authorization, nilainya diganti "[disensor]". Logger permintaan (middleware/requestLogger.ts) memang tidak
 *   mencatat header maupun body sama sekali.
 */

const level = process.env.LOG_LEVEL || 'info';
const pretty = process.env.NODE_ENV !== 'production' && process.stdout.isTTY && level !== 'silent';

/** Opsi logger (tanpa transport), juga dipakai test untuk memeriksa sensor data sensitif. */
export const loggerOptions: LoggerOptions = {
  name: 'tkbj-admin-api',
  level,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'headers.authorization',
      'headers.cookie',
      'password',
      'token',
      '*.password',
      '*.currentPassword',
      '*.newPassword',
      '*.confirm',
      '*.token',
      '*.authorization',
    ],
    censor: '[disensor]',
  },
};

export const logger = pino({
  ...loggerOptions,
  ...(pretty && { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,name' } } }),
});

export default logger;
