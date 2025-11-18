import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'deped-logo.png', 'edusync-logo.png'],
      manifest: {
        name: 'EduSync School Information System',
        short_name: 'EduSync',
        description: 'Complete school management system with offline-first capabilities',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Less aggressive precaching - only essential files
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        
        // Reduce cache size
        maximumFileSizeToCacheInBytes: 3000000, // 3MB max per file
        
        runtimeCaching: [
          {
            // Firestore API - Network first with shorter timeout and smaller cache
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-api',
              expiration: {
                maxEntries: 25, // Reduced from 50
                maxAgeSeconds: 60 * 60 * 12 // 12 hours instead of 24
              },
              networkTimeoutSeconds: 5, // Faster timeout
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Other Google APIs - Cache first
            urlPattern: /^https:\/\/.*\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-apis',
              expiration: {
                maxEntries: 10, // Reduced from 20
                maxAgeSeconds: 60 * 60 * 24 * 3 // 3 days instead of 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Fonts - Long-term cache
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ],
        
        // Disable navigation preload to reduce initial requests
        navigationPreload: false,
        
        // Clean up old caches
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false, // Disable in dev to avoid conflicts with HMR
        type: 'module'
      }
    })
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase libraries
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage'
          ],
          // Utility libraries
          'vendor-utils': [
            'html2canvas',
            'jspdf',
            'react-webcam',
            'react-image-crop',
            'browser-image-compression'
          ],
        }
      }
    },
    chunkSizeWarningLimit: 600,
    minify: 'esbuild', // Use esbuild instead of terser (faster and built-in)
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
  },
  server: {
    hmr: {
      overlay: true
    }
  }
})
