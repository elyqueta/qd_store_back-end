import { rateLimit } from 'express-rate-limit';

/**
 * Rate limiter dedicado ao endpoint de login.
 *
 * Por que um limiter separado do global?
 *
 * O limiter global (ver rateLimiter.ts) protege a API inteira contra
 * abuso genérico, mas com uma margem generosa — ele não pode ser
 * apertado demais, senão prejudica uso legítimo de qualquer rota.
 * Login é diferente: é o único ponto de entrada onde um atacante
 * ganha algo tentando repetidamente (adivinhar senha por força
 * bruta). Um limite de 10 tentativas a cada 15 minutos, POR IP, é
 * suficiente para um utilizador legítimo que erra a senha algumas
 * vezes, mas inviabiliza um ataque de força bruta automatizado.
 *
 * Nota técnica: usamos a importação NOMEADA `{ rateLimit }`, não a
 * importação default. Sob "moduleResolution": "node16" (ver
 * tsconfig.json), a importação default deste pacote específico nem
 * sempre resolve corretamente para o tipo real da biblioteca — o
 * TypeScript pode cair num tipo não resolvido, e o ESLint
 * (@typescript-eslint/no-unsafe-assignment) sinaliza isso
 * corretamente como risco. A importação nomeada é a forma
 * recomendada pela própria documentação do express-rate-limit a
 * partir da v7, e resolve o tipo de forma correta e verificável.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    status: 'error',
    message: 'Muitas tentativas de login. Tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});