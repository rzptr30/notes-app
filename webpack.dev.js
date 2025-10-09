const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    host: '127.0.0.1',
    port: 5173,
    open: true,
    hot: true,
    historyApiFallback: true,
    devMiddleware: {
      writeToDisk: true,
      publicPath: '/',
    },
    client: {
      overlay: true,
      logging: 'info',
    },
    proxy: [
      {
        context: ['/v2'],
        target: 'https://notes-api.dicoding.dev',
        changeOrigin: true,
        secure: true,
        onProxyReq: (proxyReq, req, res) => {
          try {
            proxyReq.setHeader('Origin', 'https://notes-api.dicoding.dev');
          } catch (_) {}
        },
        onProxyRes: (proxyRes, req, res) => {
          try {
            // Log di terminal dev-server: original URL -> proxied path on target
            const proxiedPath = proxyRes.req && proxyRes.req.path ? proxyRes.req.path : '(unknown)';
            console.log(`[proxy] ${req.method} ${req.originalUrl} -> ${proxiedPath} (status ${proxyRes.statusCode})`);
          } catch (e) {}
        },
        onError: (err, req, res) => {
          console.error('Proxy error:', err && err.message);
        },
      },
    ],
  },
});