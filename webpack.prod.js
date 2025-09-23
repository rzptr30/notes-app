const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    // penting untuk GitHub Pages: sesuaikan dengan nama repo
    publicPath: '/notes-app/'
  },
  optimization: {
    splitChunks: { chunks: 'all' }
  }
});