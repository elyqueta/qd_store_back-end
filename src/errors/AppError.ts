/**
 * Classe base para todos os erros "esperados" (operacionais) da API —
 * erros de negócio, validação, autenticação, recurso não encontrado
 * etc. — em oposição a erros inesperados (bugs, falhas de biblioteca,
 * exceções não previstas).
 *
 * Por que essa distinção importa?
 *
 * Um erro operacional é algo que a aplicação PREVIU que podia
 * acontecer: "esse produto não existe", "esse CPF já está
 * cadastrado", "esse token expirou". Nesses casos é seguro responder
 * ao cliente com uma mensagem clara e um status HTTP apropriado,
 * porque a própria aplicação decidiu o texto da mensagem.
 *
 * Um erro NÃO operacional é um bug: uma exceção que ninguém previu
 * (ex: uma propriedade undefined sendo acessada, uma falha de rede
 * não tratada em outro lugar). Nesses casos, a mensagem do erro pode
 * conter detalhes internos da implementação (nomes de variáveis,
 * caminhos de arquivo, trechos de query SQL) que NUNCA devem vazar
 * para o cliente — apenas logamos internamente e respondemos com uma
 * mensagem genérica.
 *
 * O middlewares/errorHandler.ts usa `instanceof AppError` para saber
 * se está lidando com um erro do primeiro tipo (seguro para expor) ou
 * do segundo (deve ser mascarado na resposta).
 */
export abstract class AppError extends Error {
  /** Status HTTP que deve ser retornado ao cliente para este erro. */
  public readonly statusCode: number;

  /**
   * Sempre `true` para instâncias de AppError — por definição, todo
   * erro que criamos explicitamente com `throw new NotFoundError(...)`
   * é um erro que a aplicação previu e sabe tratar.
   */
  public readonly isOperational: boolean;

  /**
   * Informação adicional opcional (ex: lista de campos inválidos em
   * um erro de validação). Fica de fora da mensagem principal para
   * que o cliente possa tratá-la separadamente, se quiser.
   */
  public readonly details?: unknown;

  protected constructor(message: string, statusCode: number, details?: unknown) {
    super(message);

    // Necessário ao estender uma classe nativa (Error) em TypeScript
    // compilando para ES2022+: sem isso, `instanceof AppError` pode
    // falhar em alguns cenários de transpilação/target.
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    // Remove o próprio construtor do stack trace registrado, para que
    // o log aponte direto para onde o erro foi de fato lançado
    // (`throw new NotFoundError(...)`), e não para dentro desta classe.
    Error.captureStackTrace(this, this.constructor);
  }
}
