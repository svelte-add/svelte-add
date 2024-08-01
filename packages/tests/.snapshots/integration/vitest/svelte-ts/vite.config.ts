import { defineConfig } from "vitest/config";
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],

  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
})
