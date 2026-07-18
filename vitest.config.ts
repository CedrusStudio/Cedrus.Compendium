import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        '**/mockData',
        'src/common/colors.ts',
        'src/common/icons.tsx',
        'src/common/translations.ts',
        'src/common/global/**',
        'src/common/components/cards/**',
        'src/common/components/fields/**',
        'src/common/components/selects/**',
        'src/common/components/ui/**',
        'src/common/hooks/usePersonalization.ts',
        'src/application/bestiary/drawers/**',
        'src/application/characters/list/CharactersHeadersList.tsx',
        'src/application/common/combat/PowerSpecificationEditableFields.tsx',
        'src/application/compendium/equipment/shields/ShieldsList.tsx',
        'src/infrastructure/clients/**',
        'src/infrastructure/searchQueries/characters/**',
        'src/persistence/cacheKeys.ts',
        'src/application/compendium/**/*Constants.ts',
        'src/generated/**',
        '.next/**',
        'prisma/**',
        'scripts/**',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
  },
  resolve: {
    alias: {
      '@/ui': path.resolve(__dirname, './src/common/components/ui'),
      '@': path.resolve(__dirname, './src'),
      // The real `server-only` package throws unconditionally under the
      // resolution condition Vite/Vitest use (see
      // src/__tests__/mocks/serverOnlyStub.ts for the full explanation).
      // Aliased to a no-op here only for tests.
      'server-only': path.resolve(__dirname, './src/__tests__/mocks/serverOnlyStub.ts'),
    },
  },
});
