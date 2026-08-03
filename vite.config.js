import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      // 'prompt' (bukan 'autoUpdate'): versi baru TIDAK langsung mengambil
      // alih & memuat ulang halaman sendiri — itu bikin app terasa
      // "refresh sendiri" pas user lagi ngetik. Sekarang munculkan tawaran
      // dulu lewat UpdatePrompt.vue, user yang menentukan kapan.
      registerType: 'prompt',
      // Registrasi ditangani manual di UpdatePrompt.vue lewat
      // virtual:pwa-register/vue — jangan diinject lagi biar nggak dobel.
      injectRegister: null,
      manifest: {
        name: 'Soulmate Planner',
        short_name: 'Soulmate',
        description: 'Aplikasi perencanaan pernikahan',
        theme_color: '#5C1A3A',
        background_color: '#5C1A3A',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: { host: true },
})
