import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Recria o banco de teste uma vez antes de tudo.
    globalSetup: ['./test/setup/global-setup.ts'],
    setupFiles: ['./test/setup/load-env.ts'],
    // Os arquivos usam o mesmo banco, então rodam um de cada vez.
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
