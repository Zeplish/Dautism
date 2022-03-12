const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpackUglifyJsPlugin = require('webpack-uglify-js-plugin');
const webpackDevConfig = require('./webpack.dev.config.js');
const webpackProdConfig = require('./webpack.prod.config.js');

let outputPath = path.resolve(__dirname, 'dist')
let sourcePath = path.resolve(__dirname, 'app')
let fastClickPath = path.resolve(__dirname, 'node_modules', 'fastclick', 'lib')

let isProduction = process.env.NODE_ENV === 'production'

if (isProduction) {
  module.exports = webpackProdConfig;
} else {
  module.exports = webpackDevConfig;
}
