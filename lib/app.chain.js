module.exports = (config, app, mw, ordered, libs) => ({


  begin() {
    app.use(mw.$.wrap || mw.req.wrap({context:config.middleware.ctx}))
  },


  order(key, use) {
    var group = ordered ? ordered[key] : null
    if (!group)
      use()
    else {
      for (var mwFn of ordered[key].before||[]) app.use(mwFn)
      use()
      for (var mwFn of ordered[key].after||[]) app.use(mwFn)
    }
  },


  session(Store) {
    var Session = require('express-session')
    var cfg = Object.assign({}, config.middleware.session, { store: Store(Session) })

    var defaultSession = Session(cfg)
    this.order('session', () => {
      app.use(cfg.regulate ? mw.session.regulate(defaultSession, cfg.regulate) : defaultSession)
      if (config.auth && libs.passport) {
        var sessionData = cfg.authedData.split(' ')
        var {passport} = libs
        passport.serializeUser((usr,cb)=>cb(null, _.pick(usr,sessionData)))
        passport.deserializeUser((session,cb)=>cb(null, session))
        app.use(passport.initialize())
        app.use(passport.session())
        $load(`CONFIGED   Session${cfg.regulate?' (regulated)':''}`)
      }
    })

  },


  // -- TODO, drive more options by config by allows folks to
  // -- extend meanair-middlware and inject here by reading
  // -- some for of config section like
  // -- config.http.middleware.plugins
  plugins() {
    var cfg = config.middleware.plugins
    if (cfg.indexOf('res.slow') != -1)
      app.use(mw.req.slow())
    if (cfg.indexOf('livereload') != -1 && libs.livereload)
      app.use(libs.livereload(config.livereload))
  },



  end(done) {
    var {port} = config.http
    return function() {
      $load(`ENDED      Routes (w notFound + error)`)
      app.use(mw.$.notFound || mw.res.notFound())
      app.use(mw.$.error || mw.res.error())

      var cb = done || (e => {})
      app.listen(port, () => {
        $load(`LISTENING  on port ${port}`)
        cb()
      }).on('error', cb)
    }
  }


})
