import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { appConfig } from './src/config/app';

// GitHub Pages hostuje projektový repozitář pod /<název-repozitáře>/.
// Workflow nastaví BASE_PATH; lokálně stačí relativní cesta, protože
// aplikace používá HashRouter a všechny stránky běží z jednoho index.html.
const base = process.env.BASE_PATH && process.env.BASE_PATH.length > 0 ? process.env.BASE_PATH : './';

export default defineConfig({
  base,
  build: {
    // Starší iPhony (Safari 14) a prohlížeče přibližně od roku 2020: novější syntaxi
    // převede build, aby se aplikace nespustila jako prázdná stránka.
    target: ['es2020', 'safari14', 'chrome87', 'edge88', 'firefox78'],
    cssTarget: ['safari14', 'chrome87', 'firefox78'],
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'app-config-html',
      transformIndexHtml(html) {
        return html
          .replaceAll('%APP_NAME%', appConfig.name)
          .replaceAll('%APP_DESCRIPTION%', appConfig.description);
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
});
