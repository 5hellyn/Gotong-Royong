import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET ||
  'https://gotongroyong-backend-bscseeayena5drd9.centralus-01.azurewebsites.net';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
