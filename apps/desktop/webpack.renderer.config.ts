import type { Configuration } from 'webpack';

import path from 'path';
import { plugins } from './webpack.plugins';
import { rules } from './webpack.rules';

rules.push({
    test: /\.css$/,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
});

export const rendererConfig: Configuration = {
    module: {
        rules
    },
    plugins,
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
        alias: {
            stream: 'stream-browserify', // Use the browser-compatible stream implementation
            assert: 'assert', // Map 'assert' to the installed polyfill
            // assert: 'assert', // Map 'assert' to the installed polyfill
            react: path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
            'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
            'styled-components': path.resolve(__dirname, './node_modules/styled-components'),
            'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
            '@tanstack/react-query': path.resolve(
                __dirname,
                './node_modules/@tanstack/react-query'
            ),
        },
        fallback: {
            vm: false,
            events: require.resolve('events/'),
            buffer: require.resolve('buffer/'),
            stream: require.resolve('stream-browserify'),
            crypto: require.resolve('crypto-browserify')
        }
    }
};
