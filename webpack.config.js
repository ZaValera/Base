const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

module.exports = env => {
    const isDev = env && env.dev;
    const dirname = env && env.dirname || __dirname;
    const mode = isDev ? 'development' : 'production';
    const devtool = isDev ? 'inline-source-map' : 'source-map';
    
    function getCommonLoaders() {
        const loaders = [];

        if (isDev) {
            loaders.push({
                loader:'cache-loader',
                options: {
                    cacheDirectory: path.resolve(dirname, 'webpack_cache'),
                },
            });
        }

        return loaders;
    }

    const frontConfig = {
        mode,
        devtool,
        target: 'web',
        entry: './front/src/index.tsx',
        output: {
            filename: '[name].[contenthash].js',
            chunkFilename: '[name].[chunkhash].js',
            path: path.resolve(dirname, 'front/build'),
            publicPath: '/build/',
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: [
                        ...getCommonLoaders(),
                        {
                            loader: 'ts-loader',
                            options: {
                                configFile: path.resolve(dirname, 'front/tsconfig.json'),
                                experimentalWatchApi: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|svg|jpg|gif)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: 'images/[name]_[hash].[ext]',
                            }
                        }
                    ]
                },
                {
                    test: /\.(eot|ttf|woff)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: 'fonts/[name]_[hash].[ext]',
                            }
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        ...getCommonLoaders(),
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                    ],
                },
                {
                    test: /\.s[ac]ss$/i,
                    exclude: /node_modules/,
                    use: [
                        ...getCommonLoaders(),
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: isDev,
                                localsConvention: 'camelCase',
                                importLoaders: 3,
                                modules: {
                                    localIdentName: isDev ? '[name]--[local]--[hash:base64:6]' : '[hash:base64:6]',
                                },
                            },
                        },
                        {
                            loader: 'resolve-url-loader',
                            options: {
                                keepQuery: true,
                            }
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                implementation: require('sass'),
                                sassOptions: {
                                    includePaths: ['node_modules'],
                                },
                            },
                        },
                        {
                            loader: 'sass-resources-loader',
                            options: {
                                resources: [
                                    path.resolve(dirname, 'front/src/styles/vars.scss'),
                                    path.resolve(dirname, 'front/src/styles/mixins.scss'),
                                ],
                            },
                        },
                    ],
                },
            ],
        },
        resolve: {
            extensions: ['.js', '.tsx', '.ts'],
            modules: [
                path.resolve(dirname, 'node_modules'),
            ],
            alias: {
                src: path.resolve(dirname, 'front/src'),
                shared: path.resolve(dirname, 'shared'),
                assets: path.resolve(dirname, 'front/assets'), // для import в ts
                './front': path.resolve(dirname, 'front'), // для url() в scss
            },
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: 'css/[name].css',
                chunkFilename: 'css/[id].css',
            }),
            new HtmlWebpackPlugin({
                hash: true,
                inject: true,
                filename: 'index.html',
                template: path.resolve(dirname, './front/src/index.html'),
            }),
            new FriendlyErrorsWebpackPlugin(),
        ],
        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                cacheGroups: {
                    default: {
                        reuseExistingChunk: true,
                    },
                    index: {
                        reuseExistingChunk: true,
                        test: /front\/src\/components.*\.tsx?$/,
                        name: 'components',
                        chunks: 'all',
                        enforce: true,
                    },
                    // Возможно в этом чанке нет смысла
                    styles: {
                        name: 'styles',
                        test: /\.scss$/,
                        chunks: 'all',
                        enforce: true,
                    },
                    node_modules: {
                        test: /[\\/]node_modules[\\/]/,
                        chunks: 'all',
                        minSize: 50000, // Все модули меньше 50 Кб будут попадать в main чанк
                        name(module) {
                            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                            return `npm/${packageName.replace('@', '')}`;
                        },
                        reuseExistingChunk: true,
                        enforce: true,
                    },
                }
            },
        },
    };

    const backConfig = {
        mode,
        devtool,
        target: 'node',
        entry: './back/src/index.ts',
        output: {
            filename: 'index.js',
            path: path.resolve(dirname, 'back/build'),
            publicPath: '/build/',
        },
        node: {
            __dirname: false,
        },
        externals: [nodeExternals()],
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [
                        ...getCommonLoaders(),
                        {
                            loader: 'ts-loader',
                            options: {
                                configFile: path.resolve(dirname, 'back/tsconfig.json'),
                                experimentalWatchApi: true,
                            },
                        },
                    ],
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
            // modules: ['node_modules'],
            alias: {
                src: path.resolve(dirname, './back/src'),
                shared: path.resolve(dirname, './shared'),
            },
        },
        plugins: [
            new FriendlyErrorsWebpackPlugin(),
        ],
    };

    return [
        frontConfig,
        backConfig,
    ];
};