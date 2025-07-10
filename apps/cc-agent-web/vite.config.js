import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// https://vite.dev/config/
export default defineConfig({
    base: './',
    build: {
        // minify: false,
        // terserOptions: {
        //     compress: false,
        //     mangle: false
        // },
        outDir: '../cc-agent-adr/app/src/main/assets', // Specify Android assets folder
        emptyOutDir: true // Clears the output directory before building
    },
    server: {
        proxy: {
            '/appInfo': {
                target: 'http://192.168.110.197:4448',
                changeOrigin: true,
                secure: false,
                rewrite: function (path) { return path.replace(/^\/appInfo/, ''); },
                // Additional resilience options:
                timeout: 30000
            },
            '/jsonrpc': {
                target: 'http://192.168.110.197:4448',
                changeOrigin: true,
                secure: false
            }
        }
    },
    plugins: [react()]
});
