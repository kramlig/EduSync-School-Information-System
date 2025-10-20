import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
          // Query and state management
          'vendor-query': ['@tanstack/react-query'],
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
