import { CorsOptions } from 'cors';
import { env } from './env';

/**
 * Por que centralizar as opções de CORS aqui, e não escrever
 * `app.use(cors({...}))` direto em app.ts?
 *
 * Mesmo motivo de swagger.ts e env.ts: app.ts deve ficar como um
 * "índice" legível de tudo que a aplicação faz — registar
 * middlewares, montar rotas — sem carregar a lógica de CADA
 * middleware dentro dele. Se um dia a regra de CORS crescer (ex:
 * origens diferentes por rota, headers customizados), a mudança
 * fica isolada neste ficheiro.
 *
 * Por que usar uma função `origin` em vez de passar `env.CORS_ORIGIN`
 * direto como valor de `origin`?
 *
 * A biblioteca `cors` aceita `origin` como array de strings — o que
 * FUNCIONARIA aqui. Mas usar uma função dá controlo explícito sobre
 * o caso de origem ausente (`undefined`), que acontece em requisições
 * que não vêm de um browser (ex: Postman, curl, um health-check
 * de infraestrutura, ou o próprio Swagger UI servido pela mesma
 * origem). Essas requisições não enviam o header `Origin`, e negá-las
 * por padrão quebraria ferramentas legítimas de teste/monitorização
 * que nunca vão respeitar CORS de qualquer forma (CORS é uma
 * restrição imposta pelo BROWSER, não pelo servidor em si).
 */
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Sem header Origin (curl, Postman, chamadas server-to-server,
    // health checks) -> deixamos passar. CORS não se aplica a esses
    // clientes; bloquear aqui não aumentaria segurança nenhuma,
    // só atrapalharia ferramentas legítimas.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (env.CORS_ORIGIN.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },

  // Permite que o browser envie cookies/credenciais em requisições
  // cross-origin. Necessário caso a autenticação futura use cookies
  // httpOnly para o refresh token; não tem efeito nenhum enquanto a
  // API usa apenas JSON puro sem cookies.
  credentials: true,

  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
