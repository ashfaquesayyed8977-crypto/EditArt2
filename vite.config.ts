import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

function onnxWasmPlugin(): Plugin {
  return {
    name: 'onnx-wasm-assets',
    configResolved(config) {
      try {
        const srcDir = path.resolve(config.root, 'node_modules/onnxruntime-web/dist');
        const destDir = path.resolve(config.root, 'public/ort-wasm');
        if (fs.existsSync(srcDir)) {
          fs.mkdirSync(destDir, { recursive: true });
          const files = fs.readdirSync(srcDir).filter((f) => f.startsWith('ort-wasm'));
          for (const file of files) {
            const srcPath = path.join(srcDir, file);
            const destPath = path.join(destDir, file);
            if (!fs.existsSync(destPath)) {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        }
      } catch (err) {
        console.warn('[Vite] Could not sync ONNX WASM assets:', err);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), onnxWasmPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react', '@imgly/background-removal', 'onnxruntime-web'],
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
  },
});
