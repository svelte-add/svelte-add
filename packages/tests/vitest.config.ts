import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['./integration/*.ts', './unit/*.ts'],
		testTimeout: 1000 * 60 * 2, // 2 minutes
		hookTimeout: 1000 * 60 * 3, // 3 minutes
		pool: 'threads',
	},
});
