import pino from 'pino';

/**
 * Logger da aplicação via Pino.
 *
 * Em desenvolvimento usa pino-pretty (colorido, legível no terminal).
 * Em produção emite JSON numa única linha — ideal para ingestão por
 * sistemas de log (Datadog, CloudWatch, ELK, etc.).
 *
 * Nível: em desenvolvimento 'debug', em produção 'info'.
 *
 * Nota: não importa de './env' para evitar importação circular
 * (env.ts importa logger.ts). Lê process.env.NODE_ENV diretamente.
 */
const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  ...(isDev ? {} : { base: { pid: undefined, hostname: undefined } }),
});
