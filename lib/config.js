var Path = require('path')
var c='cyan',g='gray',w='white',m='magenta',r='red',b='blue',y='yellow',n=null


var cfg = {
  auth: {
    loginUrl:               '/',
    loggedinUrl:            '/',
    oauth: {
      github: {
        short:              'gh',
        clientID:           'pass-override-or-set-env',
        clientSecret:       'pass-override-or-set-env'
      }
    }
  },
  log: {
    // set any of these to false to turn off
    app:                    { theme: { app:b,lapse:w,sublapse:g,config:n } },
    api:                    false,
    auth:                   true,
    dal:                    false,
    error:                  true,
    mw:                     { theme: {name:c,session:g,data:g} },
    res:                    { theme: {page:c,notFound:m,slow:m,error:r,unauthorized:m} },
    test:                   false
  },
  http: {
    port:                   3333,
    host:                   'pass-override-or-set-env',
    session: {
      saveUninitialized:    true, // saved new sessions
      resave:               false, // skip automatica re-write to the session store
      name:                 'mirco-consult',
      secret:               'mirco-consulting',
      cookie:               { httpOnly: true, maxAge: 9000000 }  // don't forget to set prod
    },
    sessionStore: {
      autoReconnect:        true,
      collection:           'pass-override-or-set-env'
    },
    static: {
      dir:                  'web/public',
      maxAge:               null,
      bundle: {
        appCss:             '/css/app.css',
        appJs:              '/js/app.js'
      }
    }
  },
  mongoUrl:                 'pass-override-or-set-env'
}


function set(obj, key, overrrides) {
  if (!obj || typeof obj !== 'object' || obj.constructor === Array) {
    var val = overrrides ? overrrides : process.env[key.toUpperCase()] || obj
    if (cfg.log.app.theme.config) console.log(key.toUpperCase()[cfg.log.app.theme.config],val)
    return val
  }

  for (var attr in obj) {
    var val = set(obj[attr], key ? key+'_'+attr : attr, overrrides?overrrides[attr]:null) || obj[attr]
    obj[attr] = (val == 'null') ? null : val
  }
}


module.exports = function(env, overrrides) {

  cfg.env                         = env
  cfg.appDir                      = process.cwd()

  if (env == 'dev') {
    require('dotenv').load({path:Path.join(cfg.appDir,'server/.env')})
    cfg.livereload                = { port: 35729 }
    cfg.http.host                 = `http://localhost:${cfg.http.port}`
  }

  if (env == 'test') {
    require('dotenv').load({path:Path.join(cfg.appDir,'test/server/.env')})
  }

  if (env == 'production') {
    var dist                      = require('../../web/dist/rev-manifest.json')
    cfg.http.static.bundle.appJs  = `/${dist['js/app.js']}`
    cfg.http.static.bundle.appCss = `/${dist['css/app.css']}`
  }

  set(cfg, null, overrrides)


  //-- Computed values
  cfg.appStaticDir                = Path.join(cfg.appDir,cfg.http.static.dir)
  cfg.appViewDir                  = Path.join(cfg.appDir,'server/views')
  cfg.http.port                   = process.env.PORT || parseInt(cfg.http.port)
  cfg.http.session.cookie.maxAge  = parseInt(cfg.http.session.cookie.maxAge)

  for (var provider in cfg.auth.oauth)
    Object.assign(cfg.auth.oauth[provider], { passReqToCallback: true,
      callbackURL: `${cfg.http.host}/auth/${provider}/callback`} )


  return cfg
}
