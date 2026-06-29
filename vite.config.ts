import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Strato',
        short_name: 'Strato',
        description: 'Boutique digitale di oggetti di design 3D',
        theme_color: '#A94F38',
        background_color: '#EDE4D8',
        display: 'standalone',
        icons: []
      }
    })
  ]
});
