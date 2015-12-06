var setConfigValue           = require('./configure.value')
var {join}                   = require('path')
var appDir                   = process.cwd()


module.exports = function(app, env, envFile) {


  env                        = env || 'dev'
  appDir                     = app.appDir || appDir


  var log = process.env.LOG_CFG_INIT || (app.log && app.log.cfg ? app.log.cfg.init : null)
  var $logIt = log ? ((v1, v2) => console.log(v1[log], v2||'')) : (v1=>{})
  $logIt(`Configure.${env}.start\n`)


  var defaults               = JSON.parse(JSON.stringify(require('./config.defaults.js')))


  var port                   = process.env.PORT || defaults.http.port
  if (env == 'dev')
    defaults.http.host       = `http://localhost:${port}`

  if (env == 'production') {
    var dist                      = require(join(appDir, 'web/dist/rev-manifest.json'))
    app.http.static.bundle.appJs  = `/${dist['js/app.js']}`
    app.http.static.bundle.appCss = `/${dist['css/app.css']}`
  }
  else if (envFile)
    //-- Bootstrap environment vars from .env file
    require('dotenv').load({path:envFile})


  var cfg                         = setConfigValue($logIt)(null, defaults, app)
  cfg.env                         = env
  cfg.appDir                      = appDir


  var {http,views,logic,middleware,model,wrappers,routes} = cfg
  var session = middleware ? middleware.session : undefined
  var static = http ? http.static : undefined

  var mapDirs = ({dirs}, path) => dirs.split(',').map(d=>join(appDir, path, d))


  if (static)   static.dirs       = mapDirs(static, 'web')
  if (views)    views.dirs        = mapDirs({dirs:views.dirs||'views'}, 'server')
  if (logic)    logic.dirs        = mapDirs({dirs:logic.dirs||'logic'}, 'server')
  if (routes)   routes.dirs       = mapDirs({dirs:routes.dirs||'routes'}, 'server')
  if (wrappers) wrappers.dirs     = mapDirs({dirs:wrappers.dirs||'wrappers'}, 'server')
  if (model) {
    model.dirs        = mapDirs({dirs:model.dirs||'model'}, 'server')
    model.dir = model.dirs[0]  // temporary for v0.6.1+v0.6.2
  }
  if (session) {
    session.cookie.maxAge         = parseInt(session.cookie.maxAge)
    session.secret                = http.cookieSecret
  }

  var oauth = cfg.auth ? cfg.auth.oauth : null
  for (var provider in oauth||{})
    Object.assign(oauth[provider], { logic: oauth[provider].logic || 'oauth',
        callbackURL: oauth[provider].callbackURL||`${http.host}/auth/${provider}/callback` })

  $logIt(`\nConfigure.${env.toUpperCase()}.end`)


  return cfg


}
