import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const isCloudAgent = process.env.CURSOR_AGENT === '1';
const disableHmr = process.env.DISABLE_HMR === 'true' || isCloudAgent;

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-dev-runtime',
        'idb',
        'lucide-react',
      ],
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/idb')) {
              return 'vendor-idb';
            }
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
              return 'vendor-pdf';
            }
            if (id.includes('/case-form/Tab')) {
              const match = id.match(/Tab([A-Za-z]+)\.tsx/);
              if (match) return `tab-${match[1].toLowerCase()}`;
            }
            if (id.includes('/case-form/') && id.includes('Analysis')) {
              return 'ceph-analyses';
            }
            if (id.includes('/bonwill/')) {
              return 'tab-bonwill';
            }
          },
        },
      },
    },
    server: {
      // Dual-stack bind so localhost works when the OS resolves it to ::1.
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: true,
      headers: {
        'Cache-Control': 'no-store',
      },
      // Cloud preview tunnels cannot reach the Vite HMR websocket reliably.
      // Disable HMR in Cursor agents to avoid the top "Disconnected" banner.
      hmr: disableHmr ? false : undefined,
      watch: disableHmr ? null : {},
      warmup: {
        clientFiles: [
          './index.html',
          './src/main.tsx',
          './src/App.tsx',
          './src/lib/db.ts',
          './src/lib/prefetch.ts',
          './src/components/Dashboard.tsx',
          './src/components/Header.tsx',
          './src/components/BottomNav.tsx',
          './src/components/CaseForm.tsx',
          './src/components/case-form/TabHistory.tsx',
        ],
      },
    },
  };
});
