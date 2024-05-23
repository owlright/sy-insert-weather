const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const { EsbuildPlugin } = require("esbuild-loader");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");

module.exports = (env, argv) => {
    const isPro = argv.mode === "production";
    const isDev = argv.mode === "development";
    if (isPro && isDev) {
        throw new Error("Cannot be both production and development mode");
    }
    const plugins = [
        new MiniCssExtractPlugin({
            filename: isPro ? "dist/index.css" : "index.css",
        })
    ];
    let entry = {
        "index": "./src/index.ts",
    };
    if (isPro) {
        entry = {
            "dist/index": "./src/index.ts",
        };
        plugins.push(new webpack.BannerPlugin({
            banner: () => {
                return fs.readFileSync("LICENSE").toString();
            },
        }));
        plugins.push(new CopyPlugin({
            patterns: [
                { from: "preview.png", to: "./dist/" },
                { from: "icon.png", to: "./dist/" },
                { from: "README*.md", to: "./dist/" },
                { from: "plugin.json", to: "./dist/" },
                { from: "src/i18n/", to: "./dist/i18n/" },
            ],
        }));
        plugins.push(new ZipPlugin({
            filename: "package.zip",
            algorithm: "gzip",
            include: [/dist/],
            pathMapper: (assetPath) => {
                return assetPath.replace("dist/", "");
            },
        }));
    }
    else if (isDev) {
        plugins.push(new CopyPlugin({
            patterns: [
                { from: "preview.png", to: "./" },
                { from: "icon.png", to: "./" },
                { from: "README*.md", to: "./" },
                { from: "plugin.json", to: "./" },
                { from: "src/i18n/", to: "./i18n/" },
            ],
        }));
        return {
            mode: "development",
            watch: true,
            devtool: "eval",
            output: {
                filename: "[name].js",
                path: path.resolve(__dirname, 'dev'),
                libraryTarget: "commonjs2",
                library: {
                    type: "commonjs2",
                },
            },
            externals: {
                siyuan: "siyuan",
            },
            entry,
            optimization: {
                minimize: false,
            },
            resolve: {
                extensions: [".ts", ".scss", ".js", ".json"],
                fallback: {
                    // "https": require.resolve("https-browserify"),
                    // "url": require.resolve("url/"),
                    // "http": require.resolve("stream-http"),
                    // "buffer": require.resolve("buffer/")
                },
            },
            module: {
                rules: [
                    {
                        test: /\.ts(x?)$/,
                        include: [path.resolve(__dirname, "src")],
                        use: [
                            {
                                loader: "esbuild-loader",
                                options: {
                                    target: "es6",
                                }
                            },
                        ],
                    },
                    {
                        test: /\.scss$/,
                        include: [path.resolve(__dirname, "src")],
                        use: [
                            MiniCssExtractPlugin.loader,
                            {
                                loader: "css-loader", // translates CSS into CommonJS
                            },
                            {
                                loader: "sass-loader", // compiles Sass to CSS
                            },
                        ],
                    }
                ],
            },
            plugins,
        }
    } else {
        plugins.push(new CopyPlugin({
            patterns: [
                { from: "src/i18n/", to: "./i18n/" },
            ],
        }));
    }
    return {
        mode: argv.mode || "development",
        watch: !isPro,
        devtool: isPro ? false : "eval",
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname),
            libraryTarget: "commonjs2",
            library: {
                type: "commonjs2",
            },
        },
        externals: {
            siyuan: "siyuan",
        },
        entry,
        optimization: {
            minimize: true,
            minimizer: [
                new EsbuildPlugin(),
            ],
        },
        resolve: {
            extensions: [".ts", ".scss", ".js", ".json"],
            fallback: {
                // "https": require.resolve("https-browserify"),
                // "url": require.resolve("url/"),
                // "http": require.resolve("stream-http"),
                // "buffer": require.resolve("buffer/")
            },
        },
        module: {
            rules: [
                {
                    test: /\.ts(x?)$/,
                    include: [path.resolve(__dirname, "src")],
                    use: [
                        {
                            loader: "esbuild-loader",
                            options: {
                                target: "es6",
                            }
                        },
                    ],
                },
                {
                    test: /\.scss$/,
                    include: [path.resolve(__dirname, "src")],
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader", // translates CSS into CommonJS
                        },
                        {
                            loader: "sass-loader", // compiles Sass to CSS
                        },
                    ],
                }
            ],
        },
        plugins,
    };
};
