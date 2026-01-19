const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './src/index.js',
    discoPivotApp: './src/examples/disco-pivot-app/index.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  devtool: 'source-map',
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 3000,
    open: true,
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          {
            loader: 'css-loader',
            options: {
              esModule: false,
              exportType: 'string'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      chunks: ['main']
    }),
    new HtmlWebpackPlugin({
      filename: 'examples/disco-pivot-app/index.html',
      template: './src/examples/disco-pivot-app/index.html',
      chunks: ['discoPivotApp']
    })
  ],
  resolve: {
    extensions: ['.js']
  }
};
