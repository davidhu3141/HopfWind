const path = require('path');

var env = 'prod' //'prod'

module.exports = {
  entry: {
    main: path.resolve(__dirname, 'src', 'main.js')
  },
  output: {
    path: path.resolve('dist/'), //env != 'prod' ? path.resolve('dist/') : path.resolve('C:/Program Files (x86)/Steam/steamapps/common/wallpaper_engine/projects/myprojects/index/dist'),
    filename: 'main.js'
  },
  devtool: env == 'prod' ? false : 'source-map'
};