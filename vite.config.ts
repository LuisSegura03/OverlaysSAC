import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Completely disable HMR websocket listeners to prevent port clashing/EADDRINUSE
      hmr: false,
      // Fully ignore state JSON writes to prevent fallback browser reloads on click
      watch: {
        ignored: ['**/overlay_state.json', '**/dist/**']
      }
    }
  };
});
