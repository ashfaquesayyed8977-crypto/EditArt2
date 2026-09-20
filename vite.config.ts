import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

function onnxWasmPlugin(): Plugin {
  return {
    name: 'onnx-wasm-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/ort-wasm/')) {
          const urlPath = req.url.split('?')[0].replace(/^\/ort-wasm\//, '');
          const srcDir = path.resolve(process.cwd(), 'node_modules/onnxruntime-web/dist');
          const filePath = path.join(srcDir, urlPath);
          if (fs.existsSync(filePath)) {
            if (filePath.endsWith('.wasm')) {
              res.setHeader('Content-Type', 'application/wasm');
            } else if (filePath.endsWith('.mjs') || filePath.endsWith('.js')) {
              res.setHeader('Content-Type', 'application/javascript');
            }
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            const stream = fs.createReadStream(filePath);
            return stream.pipe(res);
          }
        }
        next();
      });
    },
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
