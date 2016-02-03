module.exports = function(config, done) {

  var {plumber}             = this
  var cfg                   = config.http

  var express               = require('express')
  var app                   = express()
  app.Router                = express.Router


  if (cfg.static) {
    for (var dir of cfg.static.dirs)
      app.use(express.static(dir))
    if (cfg.static.bundle)
      Object.assign(app.locals, {bundle:cfg.static.bundle})
  }


  var bodyParser           = require('body-parser')
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))

  // var cookieParser         = require('cookie-parser')
  // app.use(cookieParser())


  $load(`INITED     App${cfg.static?' + Static':''} + Parsers`)


  if (config.views)
    require('./app.views')(config, app)


  var singletons = {}
  app.meanair = {
    config: config,
    lib(module) {
      Object.assign(singletons,module,{bodyParser})
      if (config.env == 'dev') // && plugins livereload?
        Object.assign(singletons,{livereload:require('connect-livereload')})

      return this
    },
    set(model, opts) {
      opts = opts || {}
      this.model = model
      if (opts.analytics) {
        this.analytics = opts.analytics.connect(model.DAL)
        global.analytics = this.analytics
      }
      this.logic = config.logic ? plumber.logic.init(model, opts.logicDir) : {}
      return this
    },
    merge({mergeConfig}) {
      var {join} = require('path')
      var {dir,model,logic,wrappers,routes} = mergeConfig()
      if (model)
        this.model.importSchemas(join(dir,'model'), model.opts)
      if (logic)
        plumber.logic.extend(this.model, this.logic, join(dir,'logic'))
      if (wrappers)
        plumber.wireWrappers(dir)
      if (routes)
        config.routes.dirs.push(join(dir,'routes'))
      return this
    },
    chain({plugins,session,api}) {
      var MW = require('meanair-middleware')(this, singletons)
      if (api) app.API = require('./app.api')(config, app, MW)
      var {ordered} = plumber.cacheMiddleware(app, MW, config.middleware.dirs)
      var chain = require('./app.chain')(config, app, MW, ordered, singletons)

      //-- Ensure wrap is first and required in the chain
      chain.begin()
      if (plugins) chain.plugins()
      if (session) chain.session(this.model.sessionStore)

      this.middleware = MW
      var routes = plumber.wireRoutes(app, config.routes.dirs)

      this.run = chain.end(done)
      return this
    }
  }


  return app

}
