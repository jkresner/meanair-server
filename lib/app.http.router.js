module.exports = function(app, express) {

  app.routers = {}

  return function(name, opts) {
    if (app.routers[name]) throw Error(`app.routers.${name} already exists`)

    opts = opts || {}
    var type = opts.type || 'html'
    var mountUrl = opts.mount || '/'
    var chain = { start: [], end: [] }

    var _r = new express()
    var routeIt = method => function() {
      var args = [].slice.call(arguments)
      for (var m of chain.start) args.splice(1,0,m)
      if (chain.end.length > 0) args.push(chain.end)
      // console.log(`route.${name} ${mountUrl}`, args)
      _r[method].apply(_r, args)
      $logIt('cfg.route', `${type}\t${method.toUpperCase()}`, `${mountUrl} :: ${args[0]}`)
      return app.routers[name]
    }

    var honeyRoutes = {
      use(middleware, at) {
        // console.log(`use.at`.white, at)
        // console.log(`use.${name}.mw`.white, middleware.length, middleware)
        // console.log('chain.start.before'.green, chain.start)
        if (at) chain.end = chain.end.concat(middleware)
        else chain.start = chain.start.concat(middleware)
        // console.log('chain.start'.green, chain.start)
        return this
      },
      static() {
        var args = [].slice.call(arguments)
        var opts = args.pop()

        // if (!(args[0]&&(args[0] instanceof String))
          // throw Error(`router.static requires url as first param: ${args[0] instanceof String}`)
        if (!opts||!opts.dir)
          throw Error(`router.static requires opts.dir as last param`)

        for (var m of chain.start) args.splice(1,0,m)
        args.push(express.static(opts.dir, opts))

        _r.use.apply(_r, args)
        $logIt('cfg.route', `static\tGET`, `${mountUrl} ${args[0]}`)
        return this
      },
      get: routeIt('get'),
      put: routeIt('put'),
      post: routeIt('post'),
      delete: routeIt('delete'),

    }


    app.routers[name] = assign({}, _r, honeyRoutes)
    app.routers[name].mount = function() { app.use(mountUrl, _r) }
    return app.routers[name]
  }

}
