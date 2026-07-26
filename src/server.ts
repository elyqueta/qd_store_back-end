import app from './app';

/**
 * server.ts é o único arquivo responsável por "ligar" a aplicação.
 * A porta ainda está fixa aqui porque a validação de variáveis de
 * ambiente (Zod) é o próximo passo do plano — quando ela existir,
 * PORT vai vir de env validada, nunca de um número solto no código.
 */
const PORT = 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`QD Store Backend rodando em http://localhost:${PORT}`);
});