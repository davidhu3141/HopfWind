const path = require('path');

var env = 'here' //'prod'

module.exports = {
  mode: 'development',
  entry: {
    main: path.resolve(__dirname, 'src', 'main.js')
  },
  output: {
    path: path.resolve(env == 'here' ? 'dist' : 'C:/Program Files (x86)/Steam/steamapps/common/wallpaper_engine/projects/myprojects/index/dist'),
    filename: 'main.js'
  },
  devtool: env == 'prod' ? false : 'eval'
};