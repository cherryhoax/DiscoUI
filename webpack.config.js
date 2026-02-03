/**
 * Webpack configuration for building the DiscoUI package and serving examples.
 * @type {import('webpack').Configuration}
 */
const path = require('path');
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    library: {
      type: 'module'
    }
  },
  experiments: {
    outputModule: true
  },
  devtool: 'source-map',
  devServer: {
    static: [
      {
        directory: path.resolve(__dirname, 'dist'),
        publicPath: '/dist'
      },
      {
        directory: path.resolve(__dirname, 'examples'),
        publicPath: '/examples'
      }
    ],
    devMiddleware: {
      publicPath: '/dist'
    },
    port: 3000,
    open: {
      target: ['/examples/index.html']
    },
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.(woff2?|ttf|eot|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]'
        }
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: 'css-loader',
            options: {
              esModule: false,
              exportType: 'string',
              importLoaders: 1
            }
          }
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: 'css-loader',
            options: {
              esModule: false,
              exportType: 'string',
              importLoaders: 2
            }
          },
          'postcss-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [],
  resolve: {
    extensions: ['.js', '.css', '.scss']
  }
};
