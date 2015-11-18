

module.exports = function(env, overrides, envFile) {

  try {
    var config          = require('./configure')(env, overrides, envFile)
  } catch (e) {
    console.log('App config error:'.red, e.message.white)
    process.exit(1)
  }


  var instrument        = require('./instrument')(config.log)
  global.$log           = instrument.debug
  global.$logIt         = instrument.logIt
  global.$shouldLogIt   = instrument.shouldLogIt
  global.$time          = instrument.time
  global.$lapse         = instrument.timeLapse
  global.$error         = instrument.error
  global.$request       = instrument.request
  global.$app           = msg => config.log && config.log.app ?
                              instrument.timeLapse('app', msg) : ''

  global.moment         = require('moment-timezone')
  var TypesUtil         = require('meanair-shared').TypesUtil
  var _                 = require('lodash')
  _.idsEqual            = TypesUtil.BSONID.equal
  _.selectFromObj       = TypesUtil.Object.select
  _.wrapFnsOfObject     = TypesUtil.Object.wrapFns
  _.cloneObj            = TypesUtil.Object.clone
  global._              = _

  if (config.wrappers)
    this.plumber.wireWrappers(config.wrappers.dir.replace('wrappers',''))

  if (config.model && config.model.cache)
    global.cache = require('./cache')

  return { config }

}
