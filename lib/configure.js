var {join}                   = require('path')
var logIt                    = null
var appDir                   = process.cwd()

function $logIt() {
  if (logIt) {
    var args = [].slice.call(arguments)
    args[0] = args[0][logIt]
    console.log.apply(null, args)
  }
}

var atBottom = val => typeof val !== 'object' || val.constructor === Array


function set(key, defaults, overrides) {
  if (overrides === undefined || overrides == '{{undefine}}')
    return '{{undefine}}'

  var config = defaults

  var atOverrideVal = overrides === null ? false : atBottom(overrides)
  var atDefaultVal = defaults === null || atBottom(defaults)
  if (atOverrideVal || atDefaultVal) {
    key = key.toUpperCase()

    if (process.env[key] !== undefined) config = process.env[key]
    else if (overrides !== null) config = overrides

    if (config == '{{required}}')
      throw Error(`Configure failed. Override or environment var required for config.${key}`)

    if (config && atBottom(config)) {
      $logIt(key, config)
      return config
    }
  }

  for (var attr in defaults) {
    var childKey = key ? `${key}_${attr}` : attr
    var childOverrides = overrides && overrides.hasOwnProperty(attr) ? overrides[attr] : null
    config[attr] = set(childKey, defaults[attr], childOverrides)
    if (config[attr] == '{{undefine}}')
      delete config[attr]
  }

  for (var attr in overrides) {
    if (!(defaults||{}).hasOwnProperty(attr) && overrides[attr]) {
      var childKey = key ? `${key}_${attr}` : attr
      config[attr] = set(childKey, null, overrides[attr])
      if (config[attr] == '{{undefine}}')
        delete config[attr]
    }
  }

  return config
}



module.exports = function(env, overrides, envFile) {

  var defaults               = JSON.parse(JSON.stringify(require('./config.default.js')))
  env                        = env || 'dev'
  appDir                     = overrides.appDir || appDir
  logIt                      = process.env.LOG_CONF_THEME_LOAD || false

  if (!logIt && overrides.log && overrides.log.conf && overrides.log.conf.theme)
    logIt = overrides.log.conf.theme.load

  $logIt(`Configure.${env.toUpperCase()}.start\n`)

  if (process.env.PORT || overrides.http && overrides.http.post)
    defaults.http.port = process.env.PORT || parseInt(overrides.http.port)

  if (env == 'dev') {
    defaults.http.host            = `http://localhost:${defaults.http.port}`
  }

  if (env == 'production') {
    var dist                      = require(join(appDir, 'web/dist/rev-manifest.json'))
    overrides.http.static.bundle.appJs  = `/${dist['js/app.js']}`
    overrides.http.static.bundle.appCss = `/${dist['css/app.css']}`
  }

  //-- Bootstrap environment variables from .env file
  if (env != 'production' && envFile)
    require('dotenv').load({path:envFile})

  var cfg = set(null, defaults, overrides)

  //-- Computed values
  cfg.env                         = env
  cfg.appDir                      = appDir

  var {http,views,logic,middleware,model,wrappers,routes,auth} = cfg
  var session = middleware ? middleware.session : undefined
  var static = http ? http.static : undefined

  if (static) static.dirs = static.dirs.split(',').map(dir => join(appDir, 'web', dir))
  if (views) views.dir            = join(appDir, 'server', 'views')
  if (logic) logic.dir            = join(appDir, 'server', 'logic')
  if (model) model.dir            = join(appDir, 'server', 'model')
  if (routes) routes.dir          = join(appDir, 'server', 'routes')
  if (wrappers) wrappers.dir      = join(appDir, 'server', 'wrappers')
  if (session) {
    session.cookie.maxAge         = parseInt(session.cookie.maxAge)
    session.secret                = http.cookieSecret
  }

  if (auth)
    for (var provider in auth.oauth||[])
      Object.assign(auth.oauth[provider], { logic:auth.oauth[provider].logic||'link',
          callbackURL: auth.oauth[provider].callbackURL||`${http.host}/auth/${provider}/callback` })

  $logIt(`\nConfigure.${env.toUpperCase()}.end`)

  return cfg
}
