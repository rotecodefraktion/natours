const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: './public/js/index.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'public/js/'),
    filename: 'bundle.js',
  },
};
