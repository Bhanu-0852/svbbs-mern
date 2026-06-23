import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // framer-motion is used widely (BookCover, Card, Modal, Button,
        // KCBalance, BookGrid, the Landing hero) across enough different
        // lazy route chunks that Vite's default automatic chunking
        // heuristic was folding it into the main entry bundle — the one
        // script every visitor downloads before anything else, even on
        // pages that never touch it. Forcing it into its own explicit,
        // separate chunk here means it's fetched once and cached, not
        // bundled into the critical first-paint path. Same reasoning as
        // why route-based code-splitting exists at all (see routes.jsx).
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion'
          }
        },
      },
    },
  },
})
