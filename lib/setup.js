var colors = require('colors')

module.exports = function(env, overrides) {

  var config            = require('./config')(env || 'dev', overrides)
  var instrument        = require('./instrument')(config.log)
  var hooks             = require('./hooks')()

  global.moment         = require('moment')
  global.util           = require('meanair-shared.util')
  var _                 = require('lodash')
  _.selectFromObj       = util.ObjectUtil.select
  _.wrapFnsOfObject     = util.ObjectUtil.wrapFns
  global._              = _

  global.$log           = instrument.log
  global.$time          = instrument.time
  global.$lapse         = instrument.timeLapse
  global.$app           = (msg) => instrument.timeLapse('app', msg)
  global.$error         = instrument.error
  global.$request       = instrument.request

  global.$require       = hooks.$require
  global.$requireIndex  = hooks.$requireIndex

  return { config }

}
