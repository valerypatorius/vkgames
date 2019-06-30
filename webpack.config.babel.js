import { resolve } from 'path';
import { HotModuleReplacementPlugin } from 'webpack';
// import Autoprefixer from 'autoprefixer';

import Config from './src/config';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const OUTPUT = {
    js: 'app.js',
};

/**
 * Dev server options
 */
const devServer = {
    compress: true,
    port: 3000,
    host: '0.0.0.0',
    hot: true,
    clientLogLevel: 'error',
};

/**
 * Plugins list
 */
const plugins = [
    new HotModuleReplacementPlugin(),
];

export default {
    mode: IS_PRODUCTION ? 'production' : 'development',
    devServer,
    entry: './src/index.js',
    output: {
        path: resolve(__dirname, './'),
        filename: OUTPUT.js,
        library: Config.name,
        // libraryTarget: 'umd',
        // globalObject: 'this',
    },
    module: {
        rules: [
            {
                test: /\.styl$/,
                loader: 'style-loader!css-loader!stylus-loader',
            },
        ],
    },
    watch: !IS_PRODUCTION,
    plugins,
};
