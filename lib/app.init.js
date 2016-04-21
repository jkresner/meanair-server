module.exports = function(config, done) {

  var {plumber}              = this

  var express                = require('express')
  var {json,urlencoded}      = require('body-parser')

  var cfg                    = path => _.get(config, path)
  var app                    = express()
  var honey                  = { cfg }
  honey.Router = require('./app.http.router')(app, express)


  var static                 = cfg('http.static') || {dirs:[]}
  for (var dir of static.dirs)
    app.use(express.static(dir,static.opts))


  app.use([json(),urlencoded({extended:true})])
  app.locals.libs = {jsonParser:json}


  if (cfg('templates.dirs'))
    require('./app.views')(app, config.templates, {plumber})


  var meanair = {
    // Object   @modules
    lib(modules) {
      assign(app.locals.libs, modules)
      return this
    },
    set(model, opts) {
      opts = opts || {}
      this.model = model
      this.logic = config.logic ? plumber.logic.init(model, opts.logicDir) : {}
      $load(`SET  APP MODEL + LOGIC`)
      return this
    },
    merge(app2) {
      var {dir,model,lib,logic,wrappers,routes} = app2.mergeConfig(config)

      if (lib)
        this.lib(lib)
      if (model)
        this.model.importSchemas(join(dir,'model'), model.opts)
      if (logic)
        plumber.logic.extend(this.model, this.logic, join(dir,'logic'))
      if (wrappers)
        plumber.wireWrappers(dir)
      if (routes)
        config.routes.dirs.push(join(dir,'routes'))

      $load(`MERGED  APP`)
      return this
    },
    chain(middleware, routes) {
      return require('./app.chain').call(this,
        app, config, plumber, done)
    }
  }


  return assign(app,{honey,meanair})
}
