// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite'; // ← 이름: tailwind

export default defineConfig({
  plugins: [
    react(),
    tailwind(), // ← 같은 이름으로 호출
  ],
  base: '/kitaekshoppingmall/', // 레포명에 맞게 (다른 레포면 그 이름)
});
