import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  define: {
    'process.env': {}
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      // Two apps from one codebase: mobile at ./ and Google TV at ./tv/
      input: {
        mobile: resolve(__dirname, 'index.html'),
        tv: resolve(__dirname, 'tv/index.html')
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
