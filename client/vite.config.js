import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env vars based on mode (dev/prod)
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    
    // Explicitly define environment variables
    define: {
      'process.env.VITE_MAPBOX_TOKEN': JSON.stringify(env.VITE_MAPBOX_TOKEN),
      __APP_ENV__: JSON.stringify(mode)
    },

    optimizeDeps: {
      include: [
        'react-map-gl',
        'mapbox-gl',
        '@mapbox/mapbox-gl-geocoder'
      ],
      exclude: ['js-big-decimal']
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        // Ensure proper bundling
      }
    },

    build: {
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            mapbox: ['mapbox-gl'],
            react: ['react', 'react-dom'],
            vendor: ['lodash', 'axios']
          }
        }
      },
      chunkSizeWarningLimit: 1500 // Increase chunk size limit
    },

    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});