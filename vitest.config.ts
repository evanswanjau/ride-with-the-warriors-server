import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/__tests__/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: ['src/__tests__/**', 'src/index.ts'],
        },
        testTimeout: 10000,
        // Database tests share one local DB and clean it between tests: run files one at a time.
        fileParallelism: !process.env.DATABASE_URL,
    },
});
