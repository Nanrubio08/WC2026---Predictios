import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/auth': 'http://localhost:3001',
      '/api/matches': 'http://localhost:3002',
      '/api/predictions': 'http://localhost:3003',
      '/api/leaderboard': 'http://localhost:3003',
    },
  },
});
