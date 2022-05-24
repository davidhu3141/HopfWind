const path = require('path');

var env = '' //'prod'

module.exports = {
  entry: {
    main: path.resolve(__dirname, 'src', 'main.js')
  },
  output: {
    path: path.resolve('C:/Program Files (x86)/Steam/steamapps/common/wallpaper_engine/projects/myprojects/index/dist'),
    filename: 'main.js'
  },
  devtool: env == 'prod' ? false : 'source-map'
};