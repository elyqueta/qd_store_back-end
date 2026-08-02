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
 * Type guard para o erro específico que o body-parser (usado
 * internamente por `express.json()`) lança quando o corpo da
 * requisição não é um JSON sintaticamente válido — por exemplo, uma
 * vírgula sobrando antes de um `}`, chaves ou colchetes
 * desbalanceados, aspas não fechadas, etc.
 *
 * Por que verificar as TRÊS características juntas, e não apenas
 * `err instanceof SyntaxError`?
 *
 * `SyntaxError` é um erro nativo do JavaScript e pode ser lançado em
 * qualquer parte da aplicação (ex: um `JSON.parse()` dentro de um
 * service, por um motivo completamente alheio ao corpo da
 * requisição HTTP). Se tratássemos qualquer `SyntaxError` como "400,
 * corpo inválido", estaríamos mascarando bugs reais da aplicação
 * como se fossem erro do cliente — o que é exatamente o tipo de
 * problema que a distinção `AppError` vs "erro inesperado" (mais
 * abaixo) existe para evitar.
 *
 * A combinação `instanceof SyntaxError` + `status === 400` +
 * `'body' in err` é a assinatura específica que o body-parser
 * atribui SOMENTE aos erros de parsing do corpo da requisição,
 * distinguindo-os de qualquer outro SyntaxError que possa surgir em
 * outro lugar do código.
 */
function isBodyParserSyntaxError(
  err: unknown
): err is SyntaxError & { status: number; body: unknown } {
  return (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: unknown }).status === 400 &&
    'body' in err
  );
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
  // Caso 0: o cliente enviou um corpo que não é um JSON válido
  // (ex: vírgula sobrando, chaves/colchetes desbalanceados, aspas
  // não fechadas). Isto acontece ANTES de qualquer rota, controller
  // ou middleware de validação nosso ser executado — o próprio
  // express.json() já rejeita a requisição e chama next(err).
  //
  // Sem este tratamento explícito, este erro cairia no Caso 2 (erro
  // inesperado, 500) — o que é enganoso: um JSON malformado é um
  // erro do CLIENTE (400), não uma falha interna do servidor. A
  // aplicação está a funcionar perfeitamente; foi o payload que
  // chegou quebrado.
  if (isBodyParserSyntaxError(err)) {
    const body: ErrorResponseBody = {
      status: 'error',
      message: 'Corpo da requisição não é um JSON válido.',
    };

    res.status(400).json(body);
    return;
  }

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