import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // container queries e backdrop-filter já exigem navegadores com ES2022
  build: { target: 'es2022' },
})
