import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    // the 3D engine is lazy-loaded; one big vendor chunk is expected
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // stable vendor chunks: they stay cached between deploys of the site itself
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/three/')) return 'three'
          if (id.includes('@react-three')) return 'r3f'
          if (/\/(react|react-dom|scheduler)\//.test(id)) return 'react'
        },
      },
    },
  },
})
