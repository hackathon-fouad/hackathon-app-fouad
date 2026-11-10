import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/', 'db/data/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  // L'API tourne dans Node, le front dans le navigateur : pas les mêmes globales
  { files: ['api/**/*.ts'], languageOptions: { globals: globals.node } },
  { files: ['web/**/*.ts'], languageOptions: { globals: globals.browser } },
);
