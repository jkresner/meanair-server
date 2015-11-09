module.exports = (config, app, mw) => ({


  session(Store, Wrapper, {passport}) {
    var cfg = Object.assign({}, config.middleware.session)
    var Session = require('express-session')
    if (Store) Object.assign(cfg, { store: Store(Session) })
    var session = Session(cfg)
    app.use(Wrapper ? Wrapper(session) : session)
    if (config.auth && passport) {
      var sessionData          = cfg.authedData.split(' ')
      passport.serializeUser((usr,cb)=>cb(null, _.pick(usr,sessionData)))
      passport.deserializeUser((session,cb)=>cb(null, session))
      app.use(passport.initialize())
      app.use(passport.session())
    }
    $app(`CONFIGED     Session ${Store?'+Persisted':''}${Wrapper?'+Wrapped':''}`)
  },


  // -- TODO, drive more options by config by allows folks to
  // -- extend meanair-middlware and inject here by reading
  // -- some for of config section like
  // -- config.http.middleware.plugins
  plugins() {
    var cfg = config.middleware.plugins
    if (cfg.indexOf('res.slow') != -1)
      app.use(mw.res.slow())
  },


  api() {
    var cfg = config.middleware.api
    var apiResp = mw.res.api()

    app.API = function(logic, params, mws, endpoints) {
      var router = app.Router()

      for (var paramName in params || [])
        router.param(paramName, params[paramName])

      for (var apiMiddleware of mws || [])
        router.use(apiMiddleware)

      for (var method in endpoints)
        for (var fnName in endpoints[method]) {
          var argsMap = endpoints[method][fnName]
          var url = '/'+fnName.replace('get','').replace('update','').toLowerCase()
          argsMap = _.map(argsMap, map => {
            var isParams = map.indexOf('params.')===0
            if (isParams)
              url += `/:${map.replace('params.','').split(':')[0]}`
            var isParam = isParams && map.indexOf(':')!==-1
            return isParam ? map.split(':')[1] :  map
          })

          $logIt('conf.routes', method.toUpperCase(), logic, url)

          router[method](url, mw.data.logic(logic, fnName, argsMap),
            apiResp)
        }

      app.use(`${cfg.baseUrl}/${logic}`, router)
    }
  },


  errors(done) {
    var {port} = config.http
    app.use(mw.res.domainWrap())
    return function() {
      app.use(mw.res.notFound())
      app.use(mw.res.error())

      var cb = done || (e => {})
      app.listen(port, () => {
        $app(`LISTENING  on port ${port}`)
        cb()
      }).on('error', cb)
    }
  }


})
