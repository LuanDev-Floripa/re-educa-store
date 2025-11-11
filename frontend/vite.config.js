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
    sourcemap: true, // Habilitado para facilitar debugging em desenvolvimento
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Code splitting otimizado para reduzir tamanho do chunk principal
          
          // Vendor chunks principais
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Radix UI (todos os componentes)
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            // Forms
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'forms-vendor';
            }
            // Animações
            if (id.includes('framer-motion')) {
              return 'animations-vendor';
            }
            // Lucide icons
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Outros vendors
            return 'vendor';
          }
          
          // Code splitting por páginas (lazy loading)
          if (id.includes('/pages/')) {
            // Admin pages
            if (id.includes('/pages/admin/')) {
              return 'admin-pages';
            }
            // Auth pages
            if (id.includes('/pages/auth/')) {
              return 'auth-pages';
            }
            // Tools pages
            if (id.includes('/pages/tools/')) {
              return 'tools-pages';
            }
            // Store pages
            if (id.includes('/pages/store/')) {
              return 'store-pages';
            }
            // Social pages
            if (id.includes('/pages/social/')) {
              return 'social-pages';
            }
            // User pages
            if (id.includes('/pages/user/')) {
              return 'user-pages';
            }
          }
          
          // Code splitting por componentes grandes
          if (id.includes('/components/')) {
            // AI components
            if (id.includes('/components/ai/')) {
              return 'ai-components';
            }
            // Admin components
            if (id.includes('/components/admin/')) {
              return 'admin-components';
            }
            // Social components
            if (id.includes('/components/social/')) {
              return 'social-components';
            }
            // Calculators
            if (id.includes('/components/calculators/')) {
              return 'calculators-components';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 800, // Reduzido para alertar mais cedo
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
        find: '@/components/Ui',
        replacement: path.resolve(process.cwd(), './src/components/Ui')
      },
      {
        find: '@',
        replacement: path.resolve(process.cwd(), './src')
      }
    ],
  },
})
