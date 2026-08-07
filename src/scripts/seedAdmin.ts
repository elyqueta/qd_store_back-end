import { userRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password.util';
import { closePool } from '../database/pool';

/**
 * Script standalone — NÃO é parte da API HTTP. Corre uma única vez,
 * manualmente, via `npm run seed:admin`, tipicamente logo após a
 * primeira migration num ambiente novo.
 *
 * Por que ler credenciais de variáveis de ambiente (process.env)
 * diretamente, em vez de estender o schema Zod de env.ts?
 *
 * env.ts valida variáveis que a API PRECISA para arrancar, sempre.
 * ADMIN_EMAIL/ADMIN_PASSWORD só são necessários quando ALGUÉM decide
 * rodar este script — exigi-los no arranque normal da API
 * (`npm run dev`, `npm start`) obrigaria a defini-los mesmo quando
 * ninguém vai criar um admin naquele momento, uma dependência falsa.
 *
 * Por que verificar se já existe um admin com aquele email antes de
 * criar?
 *
 * Torna o script IDEMPOTENTE — seguro de correr mais de uma vez sem
 * gerar erro nem duplicar nada. Sem isto, rodar o script duas vezes
 * por engano falharia com ConflictError (email UNIQUE), o que é um
 * comportamento correto mas menos amigável do que simplesmente
 * avisar "já existe" e sair sem erro.
 */
async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME;
  const phone = process.env.ADMIN_PHONE;

  if (!email || !password || !fullName || !phone) {
    console.error(
      'Faltam variáveis obrigatórias. Defina ADMIN_EMAIL, ADMIN_PASSWORD, ' +
        'ADMIN_FULL_NAME e ADMIN_PHONE antes de correr este script.\n' +
        'Exemplo:\n' +
        '  ADMIN_EMAIL=admin@qd.co.ao ADMIN_PASSWORD=SenhaForte123 ' +
        'ADMIN_FULL_NAME="Admin QD" ADMIN_PHONE=923000000 npm run seed:admin'
    );
    process.exit(1);
  }

  const existing = await userRepository.findByEmail(email);

  if (existing) {
    console.warn(`Utilizador com email "${email}" já existe (id: ${existing.id}). Nada a fazer.`);
    await closePool();
    return;
  }

  const passwordHash = await hashPassword(password);

  const admin = await userRepository.create({
    fullName,
    email,
    passwordHash,
    phone,
    accountType: 'personal',
    role: 'admin',
  });

  console.warn(`Admin criado com sucesso: ${admin.email} (id: ${admin.id})`);
  await closePool();
}

seedAdmin().catch((err: unknown) => {
  console.error('Erro ao criar admin:', err);
  process.exit(1);
});