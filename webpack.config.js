const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
	mode: "production",
	entry: "./src/index.js",
	output: {
		filename: "[name].[contenthash].js",
		path: path.resolve(__dirname, "build"),
		publicPath: "/",
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: "babel-loader",
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, "css-loader"],
			},
			{
				test: /\.(png|jpe?g|gif|svg|webp)$/i,
				type: "asset/resource",
				generator: {
					filename: "images/[hash][ext][query]",
				},
			},
		],
	},
	optimization: {
		splitChunks: {
			chunks: "all",
		},
		minimize: true,
		minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
	},
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			template: "./public/index.html",
			favicon: "./public/favicon.ico",
		}),
		new MiniCssExtractPlugin({
			filename: "[name].[contenthash].css",
		}),
		new BundleAnalyzerPlugin(), // Optional: for analyzing the bundle size
	],
	devServer: {
		contentBase: path.join(__dirname, "build"),
		compress: true,
		port: 9000,
		historyApiFallback: true,
	},
};
