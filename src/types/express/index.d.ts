import { AccessTokenPayload } from '../../utils/token.util';

/**
 * Module augmentation: estende o tipo Request do Express para
 * incluir `user`, preenchido pelo middleware authenticate.ts após
 * verificar o access token com sucesso.
 *
 * Por que isto precisa viver num arquivo `.d.ts` próprio, em vez de
 * simplesmente declarar isto dentro de authenticate.ts?
 *
 * Declarações de módulo (`declare global`) só têm efeito em todo o
 * projeto quando o TypeScript as reconhece como um "arquivo de
 * tipos ambiente" — isto é, um arquivo cujo único propósito é
 * declarar tipos, sem exportar nada em runtime. Colocar isto junto
 * de código executável (como authenticate.ts) funcionaria localmente
 * nesse arquivo, mas não garantiria que req.user fosse reconhecido
 * em QUALQUER outro arquivo do projeto que importe Request do
 * Express — que é exatamente o que precisamos aqui.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Preenchido pelo middleware `authenticate` após verificar o
       * access token com sucesso. Undefined em rotas públicas ou se
       * o middleware ainda não rodou.
       */
      user?: AccessTokenPayload;
    }
  }
}

// Um arquivo .d.ts só é tratado como "global" pelo TypeScript se não
// tiver nenhum import/export de nível superior — mas aqui PRECISAMOS
// importar AccessTokenPayload. O `export {}` no final resolve isso:
// transforma o arquivo num módulo ES (silenciando o erro do
// TypeScript sobre "arquivo de declaração ambiente não pode ter
// imports"), sem impedir que o `declare global` continue afetando o
// projeto inteiro.
export {};