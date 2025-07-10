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
            '/appInfo': 'http://192.168.196.7:4448',
            '/jsonrpc': 'http://192.168.196.7:4448'
        }
    },
    plugins: [react()]
});
