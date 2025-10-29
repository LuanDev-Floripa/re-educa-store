import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Subdomínio - sempre use '/'
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 9002,
    host: 'localhost',
    strictPort: true,
    hmr: {
      port: 9002
    },
    proxy: {
      '/api': {
        target: 'http://localhost:9001',
        changeOrigin: true,
        secure: false,
      }
    },
    watch: {
      usePolling: true
    }
  },
  resolve: {
    alias: [
      {
        find: '@/components/ui',
        replacement: path.resolve(process.cwd(), './src/components/Ui')
      },
      {
        find: '@/ui',
        replacement: path.resolve(process.cwd(), './src/ui')
      },
      {
        find: '@',
        replacement: path.resolve(process.cwd(), './src')
      }
    ],
  },
})
