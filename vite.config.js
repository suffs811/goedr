import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
      server: {
        proxy: {
            '/s/': {
                target: 'http://localhost:4000', // Matches the go server port
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/s\//, '/') // Optional: rewrite path if needed
            },
        },
    },
})