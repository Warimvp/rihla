import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Hors-ligne (PWA) : seulement en production, le SW gênerait le HMR en dev.
// Chemin relatif : fonctionne à la racine comme sous /rihla/ (GitHub Pages).
// Sur iOS (WKWebView, schéma capacitor://) il n'y a pas de service worker :
// register() échoue, le .catch() l'avale, l'app native est inchangée.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Pas de rechargement forcé quand un nouveau SW prend la main : il tomberait
  // en pleine leçon ou en plein Duel. Le lancement suivant part au réseau et
  // rapporte la nouvelle version — c'est le travail du SW, pas de la page.
  window.addEventListener('load', () => {
    // updateViaCache 'none' : le script principal du SW est déjà revalidé par
    // défaut, mais sw.js porte l'identifiant de build et ne doit jamais sortir
    // d'un cache HTTP — même si un jour il importe d'autres scripts.
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {})
  })
}
