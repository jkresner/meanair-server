module.exports = function(app, cfg, plumber, ready) {


  var {ctx,livereload,api,dirs} = cfg.middleware || {}

  if (livereload)  this.lib({livereload:require('connect-livereload')})


  var mw           = require('meanair-middleware')(this, {
    config : assign(cfg.middleware,{log:cfg.log}),
    libs   : app.locals.libs
  })


  if (api)         app.API = require('./app.api')(app, mw, api)

  if (cfg.auth) {
    mw.cache('setReturnTo', mw.session.remember('query.returnTo'))
    mw.cache('authd', mw.res.forbid('anon', user=>!user))
    mw.cache('inflateMe', mw.data.recast('user','user._id',{required:false}))
  }

  for (var dir of dirs)
    plumber.$requireDir(dir, {dependencies:[app, mw, cfg.middleware],strict:false})

  $load(`MIDDLEWARE Cached`)

  //-- Ensure req.wrap is first middlware in the meanair chain
  app.use(mw.$.wrap || mw.req.wrap({context:ctx}))


  if (cfg.middleware.session) {
    const session = require('express-session')
    var store = app.meanair.model.sessionStore(session, cfg.middleware)
    var sessionOpts = assign({session}, cfg.middleware.session, {store})
    if (cfg.middleware.session.restrict)
      sessionOpts.restrict = req => req.ctx.bot||req.ctx.dirty

    mw.cache('session', mw.session.touch(sessionOpts))
    $load(`SESSION   Working`)
  }




  if (cfg.routes) {
    for (var dir of cfg.routes.dirs)
      plumber.$requireDir(dir, {dependencies:[app, mw, cfg.routes]})
    for (var router in app.routers)
      app.routers[router].mount()

  }


  this.middleware  = mw
  $load(`ENDING      Route Chains`)


  var port = app.honey.cfg('http.port')
  var cb = ready || (e => {})
  var success = x => cb(null, $load(`LISTENING  on port ${port}`))

  this.run = () =>
    app.use(mw.$.notFound || mw.res.notFound())
       .use(mw.$.error || mw.res.error())
       .listen(port, success).on('error', cb)

  return this


}
