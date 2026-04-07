import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:3333',
        secure: false,
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://localhost:3333',
        secure: false,
        ws: true,
      },
      '/uploads': {
        target: 'https://localhost:3333',
        secure: false,
      },
    },
  },
});
