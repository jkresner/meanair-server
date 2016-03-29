'use strict';
require('colors')


class Server {


  constructor() {
    this.plumber = require('./plumber')
    this.plumber.logic = require('./logic')(this.plumber)
  }


  //-- deprecating Setup in v0.6.5
  get Setup() {
    return function() {
      return require('./setup').apply(this, arguments) }
  }


  get Config() {
    var {join} = require('path')
    return function(dir, env, dotEnv) {
      var appConfig = require(join(dir,'app.json'))
      var envFile = dotEnv ? join(dir,`app.${env}.env`) : null
      try {
        var config = require('./configure')(appConfig, env, envFile)
        this.plumber.setGlobals(config) // temp
        return config
      } catch (e) {
        console.log('App config error:'.red, e.message.white)
        process.exit(1)
      }
    }
  }


  get App() {
    var self = this
    return function() {
      return require('./app.init').apply(self, arguments)
    }
  }


  get Analytics() {
    var self = this
    return function(cfg, tracking, formatter) {
      var opts = { tracking: new LogicDataHelper({}, tracking).Project, formatter }
      return { connect: DAL => require('./analytics')(cfg, DAL, opts) }
    }
  }


}


module.exports = new Server()
