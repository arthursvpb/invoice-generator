import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'dist/**',
      'coverage/**',
      'next-env.d.ts',
      '*.config.mjs',
      '*.config.ts',
      'public/sw.js',
      'public/workbox-*.js',
      'scripts/**',
      'e2e/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
];
