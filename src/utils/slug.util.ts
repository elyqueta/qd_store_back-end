/**
 * Gera um slug URL-safe a partir de um texto livre.
 *
 * Exemplo: "Portáteis & Acessórios" -> "portateis-acessorios"
 *
 * Reutilizável por qualquer entidade que precise de slug (CATEGORY
 * agora; PRODUCT provavelmente no futuro) — por isso vive em utils/,
 * não dentro de services/category/.
 */
export function generateSlug(text: string): string {
  return (
    text
      // NFD decompõe caracteres acentuados em "letra base + acento"
      // separados (ex: "á" vira "a" + acento combinável). Isto é o
      // que permite remover o acento a seguir sem precisar de um
      // mapa manual de substituições (á, é, í, ç, ã, õ...).
      .normalize('NFD')
      // Remove os acentos já isolados pelo passo anterior. O range
      // \u0300-\u036f cobre todos os "diacritical marks" combináveis
      // do Unicode (acentos, cedilha, til, etc.).
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      // Remove qualquer caractere que não seja letra, número, espaço
      // ou hífen — inclui pontuação como "&", "!", "/".
      .replace(/[^a-z0-9\s-]/g, '')
      // Espaços (um ou mais seguidos) viram um único hífen.
      .replace(/\s+/g, '-')
      // Múltiplos hífens seguidos (podem surgir se o texto já tinha
      // hífens próximos de espaços) colapsam num só.
      .replace(/-+/g, '-')
      // Remove hífen inicial/final, caso o texto começasse ou
      // terminasse com um caractere removido nos passos anteriores.
      .replace(/^-|-$/g, '')
  );
}
