var {join}                   = require('path')
var Defaults                 = require('./config.defaults.js')
var getInstance              = require('./configure.merge')
var appDir                   = process.cwd()
var mapDirs = (dirs, path) => dirs.split(',').map(d => join(appDir, path, d))
var silent                   = () => {}


/**                                                                  configure(
* Merges config specification sources (defaults, app, env, dotEnv)
* and augments computed values to produce an instance of config with
* for an app running in a specific environment
*
*  Object    @app defines the structure of an applications config independent
*              of the environment it is running in.
*  String    @env name of the environment, e.g. but not limited to
*              'dev', 'test', 'staging', 'production'
*  String    @dotEnv path to a .env file specifying environment value
*              overrides for config in @app
/                                                                           )*/
module.exports = function(app, env, dotEnv) {

  env                          = env || 'dev'
  appDir                       = app.appDir || appDir


  //-- Load values from .env file into process.env vars
  if (dotEnv && env != 'production')
    require('dotenv').load({path:dotEnv})


  //-- Detect if (and what color) to output final config values
  var logCfg = app.log && app.log.cfg ? app.log.cfg.init : null
  var logCol = process.env.LOG_CFG_INIT || logCfg
  var $logIt = logCol ? ((v1, v2) => console.log(v1[logCol], v2||'')) : silent
  $logIt(`Configure.${env}.start\n`)


  //-- Get fresh set of meanair defaults
  var defaults                 = Defaults()
  if (env == 'dev')
    defaults.http.host         = `http://localhost:${defaults.http.port}`

  //-- Stir up app, defaults and env for our cooked config instance
  var cfg                      = getInstance(env, $logIt).merge(app, defaults)


  //-- addComputerValues() {
  var {about,views,logic,middleware,model,wrappers,routes} = cfg

  if (about)    cfg.about          = require(join(appDir, about))
  if (views)    views.dirs     = mapDirs(views.dirs||'views', 'server')
  if (logic)    logic.dirs     = mapDirs(logic.dirs||'logic', 'server')
  if (routes)   routes.dirs    = mapDirs(routes.dirs||'routes', 'server')
  if (model)    model.dirs     = mapDirs(model.dirs||'model', 'server')
  if (model)    model.dir      = model.dirs[0] // temporary for v0.6.1+v0.6.2
  if (wrappers && wrappers.dirs)
    wrappers.dirs = mapDirs(wrappers.dirs, 'server')

  if (cfg.http && cfg.http.static) {
    var {static}               = cfg.http
    static.dirs                = mapDirs(static.dirs, 'web')
    var rev = static.manifest  ? require(join(appDir, static.manifest)) : {}
    for (var bundle in rev)
      static.bundles[bundle] = rev[bundle]
  }


  if (cfg.http && middleware && middleware.session) {
    var {session}              = middleware
    session.cookie.maxAge      = parseInt(session.cookie.maxAge)
    session.secret             = cfg.http.cookieSecret
  }


  var oauth = cfg.http && cfg.auth ? cfg.auth.oauth : null
  for (var provider in oauth||{})
    Object.assign(oauth[provider], {
      logic: oauth[provider].logic || 'oauth',
      callbackURL: oauth[provider].callbackURL||`${cfg.http.host}/auth/${provider}/callback`
    })
  //--)

  $logIt(`\nConfigure.${env.toUpperCase()}.end`)
  return cfg

}
