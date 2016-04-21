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
      var startIdx = 0
      for (var m of chain.start) args.splice(++startIdx,0,m)
      for (var m of chain.end) args.push(m)

      if (mountUrl != '/' && args[0].indexOf(mountUrl) == 0)
        args[0] = args[0].replace(mountUrl,'')

      _r[method].apply(_r, args)
      while (type.length < 6) type = type + ' '
      $logIt('cfg.route', `${type}${method.toUpperCase()}`, `${mountUrl} :: ${args[0]}`)
      // console.log(`route.${name}`.white, args)
      return app.routers[name]
    }

    var honeyRoutes = {
      use(middleware, at) {
        if (at) chain.end = chain.end.concat(middleware)
        else chain.start = chain.start.concat(middleware)
        // console.log(`use.at:${name}`.green, at ? 'end' : 'start', chain.start.length)
        return this
      },
      // useEnd(middleware) { }, // consider alternate `useEnd` interface for 0.6.5
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
