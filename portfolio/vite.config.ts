import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {staticResume} from './vite-plugin-resume';

export default defineConfig({
    root: '.',
    plugins: [react(), staticResume()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: id => (id.includes('/node_modules/three/') ? 'three' : undefined),
            },
        },
    },
    server: {port: 8080}
});