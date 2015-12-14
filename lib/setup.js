

module.exports = function(Config, env, envFile) {

  try {
    var config          = require('./configure')(Config, env, envFile)
  } catch (e) {
    console.log('App config error:'.red, e.message.white)
    process.exit(1)
  }

  var instrument        = require('./instrument')(config)
  global.$log           = instrument.debug
  global.$logIt         = instrument.logIt
  global.$error         = instrument.error
  global.$request       = instrument.request
  // global.$time          = instrument.time

  global.$load = msg => config.log.app && config.log.app.init
                          ? instrument.timed('app', msg) : 0

  global.moment         = require('moment-timezone')
  var TypesUtil         = require('meanair-shared').TypesUtil
  var _                 = require('lodash')
  _.idsEqual            = TypesUtil.BSONID.equal
  _.selectFromObj       = TypesUtil.Object.select
  _.cloneObj            = TypesUtil.Object.clone
  global._              = _


  if (config.model && config.model.cache)
    global.cache = require('./cache')

  // temp
  global.LogicDataHelper = require('./logic.data')

  if (config.wrappers) {
    for (var dir of config.wrappers.dirs||[])
      this.plumber.wireWrappers(dir.replace('wrappers',''))
    if (config.comm)
      global.COMM = require('./comm')(config)
  }


  return { config }

}
