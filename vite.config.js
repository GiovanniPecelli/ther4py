import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // IMPORTANT: path relativo per GitHub Pages
  plugins: [react()],
})