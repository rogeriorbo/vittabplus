import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      // VitePWA({
      //   registerType: 'autoUpdate',
      //   manifest: {
      //     name: 'VittaBPlus - Diário de Saúde',
      //     short_name: 'VittaBPlus',
      //     description: 'Monitoramento de pressão arterial, glicose e exercícios.',
      //     theme_color: '#4f46e5',
      //     background_color: '#ffffff',
      //     display: 'standalone',
      //     orientation: 'portrait',
      //     icons: [
      //       {
      //         src: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
      //         sizes: '192x192',
      //         type: 'image/png'
      //       },
      //       {
      //         src: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
      //         sizes: '512x512',
      //         type: 'image/png'
      //       }
      //     ]
      //   }
      // })
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: ['vittabplus.deioinfo.com.br', 'localhost', '.run.app'], 
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
