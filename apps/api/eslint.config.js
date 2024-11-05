import baseConfig from '@meeting-baas/eslint-config/base';

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['.hono/**', 'dist/**', '.output/**'],
  },
  ...baseConfig,
];