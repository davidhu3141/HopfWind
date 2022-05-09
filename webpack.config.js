const path = require('path');

var env = '' //'prod'

module.exports = {
  entry: {
    main: path.resolve(__dirname, 'src', 'main.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: env == 'prod' ? false : 'source-map'
};