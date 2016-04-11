'use strict';
require('colors')


class Server {


  constructor() {
    this.plumber = require('./plumber')
    this.plumber.logic = require('./logic')(this.plumber)
  }

  get Config() {
    var {join} = require('path')
    return function(cfgDir, env, dotEnv) {
      var appCfg = require(join(cfgDir, 'app.json'))
      var envFile = dotEnv ? join(cfgDir,`app.${env}.env`) : null
      try {
        if (appCfg.appDir) appCfg.appDir = join(cfgDir, appCfg.appDir)
        var cfg = require('./configure')(appCfg, env, envFile)
        this.plumber.setGlobals(cfg) // temp
        return cfg
      } catch (e) {
        console.log('App config error:'.red, e.message.white)
        if (process.env['LOG_APP_VERBOSE']) console.log(e.stack)
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
