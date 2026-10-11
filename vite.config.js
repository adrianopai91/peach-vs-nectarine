import { defineConfig } from 'vite';

/**
 * Vite configuration.
 *
 * `base: './'` makes every asset reference relative instead of absolute
 * ("/assets/..."). That is what allows the built `dist/` folder to be uploaded
 * to GitHub Pages (or any subdirectory) and still work.
 */
export default defineConfig({
  base: './',
});
