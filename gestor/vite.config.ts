import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173, // Puerto normal para desarrollo
    host: true,
    // Sin HTTPS para desarrollo local
  },
  
  preview: {
    port: 443,
    host: true,
    https: true, // Vite generará certificados autofirmados automáticamente
  },
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
