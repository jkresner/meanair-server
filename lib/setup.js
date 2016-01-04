

module.exports = function(Config, env, envFile) {

  try {
    var config          = require('./configure')(Config, env, envFile)
  } catch (e) {
    console.log('App config error:'.red, e.message.white)
    process.exit(1)
  }

  this.plumber.setGlobals(config)

  return {config}

}
