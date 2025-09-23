const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    host: '127.0.0.1',
    port: 5173,
    open: true,
    hot: true,
    // Sajikan file dari dist (yang akan ditulis ke disk oleh dev-middleware)
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/',
      watch: true
    },
    historyApiFallback: {
      index: '/index.html',
      disableDotRule: true
    },
    // Tulis output webpack ke disk, bukan hanya in-memory
    devMiddleware: {
      writeToDisk: true,
      publicPath: '/'
    },
    client: {
      overlay: true,
      logging: 'info'
    }
  }
});