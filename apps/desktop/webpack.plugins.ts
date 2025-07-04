import dotenv from 'dotenv';
import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
    new ForkTsCheckerWebpackPlugin({
        logger: 'webpack-infrastructure'
    }),
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
     }),
    new webpack.DefinePlugin({
        'process.env': {},
        'process.browser': true,
        IS_DEV: JSON.stringify(process.env.IS_DEV),
        DEV_URL: JSON.stringify(process.env.DEV_URL),
    })
];
