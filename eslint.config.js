const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

/**
 * Flat config é o formato atual do ESLint (a partir da v9).
 * Substitui o antigo .eslintrc.json.
 *
 * A ordem dos blocos importa: cada bloco pode sobrescrever regras
 * definidas nos blocos anteriores. Por isso "eslintConfigPrettier"
 * vem por último — ele desliga qualquer regra de ESLint que brigaria
 * com o Prettier (ex: regras de espaçamento, indentação).
 */
module.exports = tseslint.config(
  // 1. Regras recomendadas base do ESLint (JS puro)
  js.configs.recommended,

  // 2. Regras recomendadas do typescript-eslint, com verificação de tipos
  ...tseslint.configs.recommendedTypeChecked,

  {
    // "files" restringe as regras type-aware SÓ aos .ts dentro de src/.
    // Sem isso, o próprio eslint.config.js (um .js solto na raiz, fora
    // do "include" do tsconfig.json) também seria linkado com regras
    // que exigem tipo resolvido, e falharia da mesma forma.
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        // Aponta explicitamente para o tsconfig.json, em vez de usar
        // "projectService" (mais novo, porém menos previsível).
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Reforça o que já temos no tsconfig, mas agora como erro de lint
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }, // permite _req, _res não usados
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // 3. Ignorar pastas que não devem ser lintadas
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },

  // 4. SEMPRE por último: desliga conflitos de formatação com o Prettier
  eslintConfigPrettier
);