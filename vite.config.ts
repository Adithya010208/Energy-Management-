
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Standardizing how the API key is passed to the Gemini SDK
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion', 'chart.js', 'react-chartjs-2'],
          genai: ['@google/genai'],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
