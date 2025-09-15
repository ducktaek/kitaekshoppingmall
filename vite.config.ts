import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],

  // GitHub Pages에 올릴 때 레포가 <repo> 라면 주석 해제:
  // base: '/<repo>/',
});
