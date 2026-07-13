import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-tooltip', '@radix-ui/react-scroll-area', '@radix-ui/react-separator', '@radix-ui/react-progress', '@radix-ui/react-label', '@radix-ui/react-avatar'],
          'vendor-data': ['@tanstack/react-query', '@supabase/supabase-js', 'zustand'],
        },
      },
    },
  },
})
