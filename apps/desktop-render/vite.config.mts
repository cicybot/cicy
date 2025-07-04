import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    define: {
        'process.env': {},
        'process.browser': true,
        IS_DEV: JSON.stringify(process.env.IS_DEV),
        REACT_APP_AMPLITUDE: JSON.stringify(process.env.REACT_APP_AMPLITUDE),
        REACT_APP_TONCONSOLE_API: JSON.stringify(process.env.REACT_APP_TONCONSOLE_API),
        REACT_APP_TG_BOT_ID: JSON.stringify(process.env.REACT_APP_TG_BOT_ID),
        REACT_APP_TG_BOT_ORIGIN: JSON.stringify(process.env.REACT_APP_TG_BOT_ORIGIN),
        REACT_APP_STONFI_REFERRAL_ADDRESS: JSON.stringify(process.env.REACT_APP_STONFI_REFERRAL_ADDRESS),
        REACT_APP_APTABASE: JSON.stringify(process.env.REACT_APP_APTABASE),
        REACT_APP_APTABASE_HOST: JSON.stringify(process.env.REACT_APP_APTABASE_HOST)
    },
    server: {
        host: '0.0.0.0',
        port: 3173
    },
    plugins: [
        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true
            },
            include: ['stream', 'buffer', 'crypto']
        }),
        react()
    ],
    resolve: {
        alias: {
            buffer: 'buffer',
            assert: 'assert', // Map 'assert' to the installed polyfill
            react: path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
            '@ton/core': path.resolve(__dirname, '../../packages/core/node_modules/@ton/core'),
            '@ton/crypto': path.resolve(__dirname, '../../packages/core/node_modules/@ton/crypto'),
            '@ton/ton': path.resolve(__dirname, '../../packages/core/node_modules/@ton/ton'),
            'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
            'styled-components': path.resolve(__dirname, './node_modules/styled-components'),
            'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
            '@tanstack/react-query': path.resolve(__dirname, './node_modules/@tanstack/react-query')
        }
    }
});
