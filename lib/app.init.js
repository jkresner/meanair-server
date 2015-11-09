module.exports = function(config, done) {

  var {plumber}             = this
  var cfg                   = config.http

  var express               = require('express')
  var app                   = express()
  app.Router                = express.Router


  if (cfg.static) {
    app.use(express.static(cfg.static.dir))
    if (cfg.static.bundle)
      Object.assign(app.locals, {bundle:cfg.static.bundle})
  }


  var cookieParser         = require('cookie-parser')
  var bodyParser           = require('body-parser')
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(cookieParser(cfg.cookieSecret))


  $app(`INITED     App${cfg.static?' + Static':''} + Parsers`)


  if (config.views)
    require('./app.views')(config, app)


  var singletons = {}
  app.meanair = {
    config: config,
    lib(module) {
      Object.assign(singletons,module)
      return this
    },
    set(model, opts) {
      var logicDir = opts ? opts.logicDir : null
      this.model = model
      this.logic = config.logic ? plumber.logic.init(model,logicDir) : {}
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
        config.routes.dir += ','+join(dir,'routes')
      return this
    },
    use({plugins,session,api}) {
      this.middleware = require('meanair-middleware')(this, singletons)
      var configure = require('./app.middleware')(config, app, this.middleware)
      this.run = configure.errors(done)
      if (plugins) configure.plugins()
      if (session) {
        var {sessionStore} = this.model
        var sessionWrapper = this.middleware.session[session.wrapper]
        configure.session(sessionStore, sessionWrapper, singletons)
      }
      if (api) configure.api()
      return this
    },
    serve() {
      plumber.wireRoutes(app, config.routes.dir)
      return this
    }
  }


  return app

}
