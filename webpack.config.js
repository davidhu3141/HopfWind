const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

let env = 'prod' //'prod' or 'here'
let minify = true

let exportPathHopfWind = 'C:/Program Files (x86)/Steam/steamapps/common/wallpaper_engine/projects/myprojects/index1'
let exportPath = exportPathHopfWind

module.exports = {
  mode: 'development',
  entry: {
    main: path.resolve(__dirname, 'src', 'main.js')
  },
  output: {
    path: path.resolve(env == 'here'
      ? 'dist'
      : path.join(exportPath, 'dist')
    ),
    filename: 'main.js'
  },
  devtool: env === 'prod' ? false : 'eval',
  optimization: minify ? {
    minimize: true,
    minimizer: [new TerserPlugin()]
  } : {},
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'index.html', to: exportPath }
      ]
    })
  ]
};