import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors';

/**
 * Formato padronizado de resposta de erro da API.
 *
 * Padronizar esse formato é importante porque quem consome a API
 * (front-end React, um app mobile futuro, outro serviço) pode tratar
 * QUALQUER erro de QUALQUER endpoint da mesma forma — sem precisar
 * conhecer a particularidade de cada rota.
 */
interface ErrorResponseBody {
  status: 'error';
  message: string;
  details?: unknown;
}

/**
 * Error handler global do Express.
 *
 * Por que a função precisa ter exatamente 4 parâmetros?
 *
 * O Express identifica um middleware como "error handler" pela
 * ARIDADE da função — isto é, pela quantidade de parâmetros que ela
 * declara. Isso é uma convenção da própria biblioteca, não do
 * TypeScript. Se você remover qualquer um dos 4 parâmetros (mesmo o
 * `next`, que nunca chegamos a chamar aqui), o Express deixa de
 * reconhecer esta função como error handler, e ela simplesmente nunca
 * é chamada quando algum código faz `next(error)`.
 *
 * Por que ele precisa ser o ÚLTIMO middleware registrado em app.ts?
 *
 * O Express só invoca um error handler quando algo ANTES dele chama
 * `next(error)` explicitamente, ou lança uma exceção síncrona dentro
 * de um handler comum. Registrar este middleware antes das rotas, ou
 * antes do notFoundHandler, significa que ele nunca seria alcançado
 * para os erros que essas rotas gerarem.
 *
 * Como isso substitui try/catch repetido em cada controller?
 *
 * Combinado com o asyncHandler (que encaminha qualquer rejeição de
 * Promise para `next(error)`), nenhum controller/service precisa
 * escrever `try { ... } catch (err) { res.status(...).json(...) }`
 * manualmente. Basta lançar a classe de erro certa (`throw new
 * NotFoundError(...)`) e este middleware cuida de transformar isso em
 * uma resposta HTTP correta e padronizada — em um único lugar.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Caso 1: erro operacional e conhecido (instância de AppError).
  // Sabemos o status HTTP correto, e a mensagem foi escrita pela
  // própria aplicação — portanto é segura para expor ao cliente.
  if (err instanceof AppError) {
    const body: ErrorResponseBody = {
      status: 'error',
      message: err.message,
    };

    if (err.details !== undefined) {
      body.details = err.details;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Caso 2: erro inesperado — um bug, uma falha de biblioteca, uma
  // exceção que ninguém previu. Logamos o erro REAL internamente
  // (essencial para investigação/debug), mas NUNCA expomos sua
  // mensagem ou stack trace ao cliente: isso poderia vazar detalhes
  // de implementação (nomes de tabelas, caminhos de arquivo, trechos
  // de query) que um atacante poderia explorar.
  console.error('Erro inesperado não tratado:', err);

  const body: ErrorResponseBody = {
    status: 'error',
    message: 'Erro interno do servidor.',
  };

  res.status(500).json(body);
}
