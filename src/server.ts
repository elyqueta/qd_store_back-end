import app from './app';
import { env } from './config/env';
import { closePool } from './database/pool';
import { logger } from './config/logger';
import { processCloudinaryDeletionQueue } from './services/cloudinaryDeletionQueue.service';

const server = app.listen(env.PORT, () => {
  logger.info(`QD Store Backend rodando em http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

const cloudinaryDeletionInterval = setInterval(() => {
  void processCloudinaryDeletionQueue().catch((error: unknown) => {
    logger.error({ err: error }, 'Falha ao consultar a fila de remoção do Cloudinary.');
  });
}, 60_000);
cloudinaryDeletionInterval.unref();
void processCloudinaryDeletionQueue().catch((error: unknown) => {
  logger.error({ err: error }, 'Falha ao consultar a fila de remoção do Cloudinary.');
});

/**
 * Shutdown gracioso.
 *
 * Importante: esta função é SÍNCRONA (retorna void), não async.
 * O motivo é o contrato do server.close(callback) do Node — ele
 * espera um callback (err?: Error) => void, e passar uma função
 * async ali criaria uma Promise "solta" (floating promise) cuja
 * rejeição ninguém captura.
 *
 * Por isso, tratamos a parte assíncrona (closePool) manualmente
 * com .then()/.catch(), em vez de usar await dentro do callback.
 */
function shutdown(signal: string): void {
  logger.info(`${signal} recebido. Encerrando graciosamente...`);
  clearInterval(cloudinaryDeletionInterval);

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Erro ao fechar servidor HTTP');
      process.exit(1);
      return;
    }

    closePool()
      .then(() => {
        logger.info('Servidor e pool de conexões encerrados.');
        process.exit(0);
      })
      .catch((closeErr: unknown) => {
        logger.error({ err: closeErr }, 'Erro ao fechar pool de conexões');
        process.exit(1);
      });
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
