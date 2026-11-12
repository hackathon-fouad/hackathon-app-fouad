import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  // Tailwind génère le CSS des classes trouvées dans index.html et src/ (ADR 0006)
  plugins: [tailwindcss()],
  server: {
    // Toutes les interfaces, comme --host : par défaut, Vite n'écoute que sur
    // localhost, et le port n'est pas joignable hors du conteneur
    host: true,
    // Les appels /api partent vers l'API, dans le même conteneur
    proxy: { '/api': 'http://localhost:3000' },
  },
});
