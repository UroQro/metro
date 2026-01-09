import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'UroMETRO Manager',
        short_name: 'UroMETRO',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      }
    })
  ]
});