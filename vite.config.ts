import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode, command }) => {
    // Local dev may use a private key. Every published build is key-free,
    // regardless of the build mode or environment variables on the host.
    const localKey = command === 'serve' ? loadEnv(mode, '.', '').OPENROUTER_API_KEY : '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [tailwindcss(), react()],
      define: {
        'process.env.OPENROUTER_API_KEY': JSON.stringify(localKey || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
