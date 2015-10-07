var {join}                   = require('path')
var cfg                      = require('./config.js')


var logConfig = process.env["LOG_CONF_THEME_LOAD"] || cfg.log.conf.theme.load


function set(obj, key, overrides) {

  if (overrides === false)
    return false

  if (!obj || typeof obj !== 'object' || obj.constructor === Array) {
    key = key.toUpperCase()
    var val = overrides ? overrides : process.env[key] || obj
    if (logConfig)
      console.log(key[logConfig], val)
    if (val == '{{required}}')
      throw Error(`Config override or environment var required for ${key}`)
    return val
  }

  for (var attr in obj) {
    var childKey = key ? `${key}_${attr}` : attr
    var val = set(obj[attr], childKey, overrides?overrides[attr]:null) || obj[attr]
    obj[attr] = (val == 'null') ? null : val
  }
}



module.exports = function(env, overrides, envFile) {

  cfg.env                         = env || 'dev'
  cfg.appDir                      = overrides.appDir || process.cwd()


  if (env == 'dev') {
    cfg.livereload                = { port: 35729 }
    cfg.http.host                 = `http://localhost:${cfg.http.port}`
  }


  if (env == 'production') {
    var dist                      = require('../../web/dist/rev-manifest.json')
    cfg.http.static.bundle.appJs  = `/${dist['js/app.js']}`
    cfg.http.static.bundle.appCss = `/${dist['css/app.css']}`
  }


  //-- Bootstrap environment variables from .env file
  if (env != 'production' && envFile)
    require('dotenv').load({path:envFile})


  set(cfg, null, overrides)


  //-- Computed values
  cfg.appStaticDir                = join(cfg.appDir, cfg.http.static.dir)
  cfg.appViewDir                  = join(cfg.appDir, 'server/views')
  cfg.appModelDir                 = join(cfg.appDir, 'server/model')
  cfg.appWrappersDir              = join(cfg.appDir, 'server/wrappers')
  cfg.appLogicDir                 = join(cfg.appDir, 'server/logic')
  cfg.http.port                   = process.env.PORT || parseInt(cfg.http.port)
  cfg.http.session.cookie.maxAge  = parseInt(cfg.http.session.cookie.maxAge)

  for (var provider in cfg.auth.oauth)
    Object.assign(cfg.auth.oauth[provider], { passReqToCallback: true,
      callbackURL: `${cfg.http.host}/auth/${provider}/callback`} )


  return cfg
}
