var {join}                   = require('path')
var logIt                    = null

function $$log() {
  if (logIt) {
    var args = [].slice.call(arguments)
    args[0] = args[0][logIt]
    console.log.apply(null, args)
  }
}

function set(key, defaults, overrides) {

  if (overrides === undefined) return '{{undefine}}'

  var config = defaults

  if (defaults === null || typeof defaults !== 'object' || defaults.constructor === Array) {
    key = key.toUpperCase()

    if (process.env[key] !== undefined) config = process.env[key]
    else if (overrides !== null) config = overrides

    if (config == '{{required}}')
      throw Error(`Configure failed. Override or environment var required for config.${key}`)

    $$log(key, config)

    return config
  }

  for (var attr in overrides) {
    if (!config.hasOwnProperty(attr) && overrides[attr]) {
      var childKey = key ? `${key}_${attr}` : attr
      config[attr] = set(childKey, null, overrides[attr])
      if (config[attr] == '{{undefine}}')
        delete config[attr]
    }
  }

  for (var attr in defaults) {
    var childKey = key ? `${key}_${attr}` : attr
    var childOverrides = overrides && overrides.hasOwnProperty(attr) ? overrides[attr] : null
    config[attr] = set(childKey, defaults[attr], childOverrides)
    if (config[attr] == '{{undefine}}')
      delete config[attr]
  }

  return config
}



module.exports = function(env, overrides, envFile) {

  var defaults               = JSON.parse(JSON.stringify(require('./config.js')))
  env                        = env || 'dev'
  logIt                      = process.env.LOG_CONF_THEME_LOAD || false

  if (!logIt && overrides.log && overrides.log.conf && overrides.log.conf.theme)
    logIt = overrides.log.conf.theme.load

  $$log(`Configure.${env.toUpperCase()}.start\n`)

  if (process.env.PORT || overrides.http && overrides.http.post)
    defaults.http.port = process.env.PORT || parseInt(overrides.http.port)

  if (env == 'dev') {
    defaults.livereload           = { port: 35729 }
    defaults.http.host            = `http://localhost:${defaults.http.port}`
  }

  if (env == 'production') {
    var dist                      = require('../../web/dist/rev-manifest.json')
    defaults.http.static.bundle.appJs  = `/${dist['js/app.js']}`
    defaults.http.static.bundle.appCss = `/${dist['css/app.css']}`
  }

  //-- Bootstrap environment variables from .env file
  if (env != 'production' && envFile)
    require('dotenv').load({path:envFile})

  var cfg = set(null, defaults, overrides)

  //-- Computed values
  cfg.appDir                      = overrides.appDir || process.cwd()
  cfg.appStaticDir                = join(cfg.appDir, cfg.http.static.dir)
  cfg.appViewDir                  = join(cfg.appDir, 'server/views')
  cfg.appModelDir                 = join(cfg.appDir, 'server/model')
  cfg.appWrappersDir              = join(cfg.appDir, 'server/wrappers')
  cfg.appLogicDir                 = join(cfg.appDir, 'server/logic')
  cfg.http.session.cookie.maxAge  = parseInt(cfg.http.session.cookie.maxAge)

  if (cfg.auth && cfg.auth.oauth)
    for (var provider in cfg.auth.oauth)
      Object.assign(cfg.auth.oauth[provider], { passReqToCallback: true,
        callbackURL: `${cfg.http.host}/auth/${provider}/callback`})

  $$log(`\nConfigure.${env.toUpperCase()}.end`)

  return cfg
}
