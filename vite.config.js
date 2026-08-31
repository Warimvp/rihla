import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Base relative : l'app se déploie n'importe où (racine, sous-chemin
  // GitHub Pages /rihla/, WebView Capacitor) sans retoucher les chemins.
  base: './',
  plugins: [react()],
  server: { port: 5183, strictPort: true },
})
