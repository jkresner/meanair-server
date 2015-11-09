module.exports = (config, app, mw, libs) => ({


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
    $app(`CONFIGED   Session${Store?'+Persisted':''}${Wrapper?'+Wrapped':''}`)
  },


  // -- TODO, drive more options by config by allows folks to
  // -- extend meanair-middlware and inject here by reading
  // -- some for of config section like
  // -- config.http.middleware.plugins
  plugins() {
    var cfg = config.middleware.plugins
    if (cfg.indexOf('res.slow') != -1)
      app.use(mw.res.slow())
    if (cfg.indexOf('livereload') != -1 && libs.livereload)
      app.use(libs.livereload(config.livereload))
  },


  api() {
    app.API = require('./app.api')(config, app, mw)
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
