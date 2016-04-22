'use strict';

module.exports = function(app, mw, api) {

  var endpoints = function(router, logic, method, params) {

    return (opts, cfg) => {
      // $log(`API.${logic}.${method.toUpperCase()}.cfg|opts`.white, cfg, opts, params)
      if (!cfg) {
        cfg = opts
        opts = {}
      }
      for (var fnName in cfg) {
        var url = ('/'+fnName)
          .replace(/get|update|create|delete/i,'')
          .toLowerCase()
          .replace(/^\/$/,'')

        var argsMap = cfg[fnName].split(' ')
                                 .filter(elm=>elm!='')
                                 .map(map => {
          if (map.indexOf('params.') == 0 || params.indexOf(map) != -1)
            url += `/:${map.replace('params.','').split(':')[0]}`

          return map
        })

        var args = [url]
        // $log(`API.${logic}.${method.toUpperCase()}.logic.${fnName}`.white, app.meanair.logic[logic][fnName])
        // $log(`API.${logic}.${method.toUpperCase()}.argsMap`.white, argsMap)

        if (!app.meanair.logic[logic][fnName])
          throw Error(`api:${logic.gray}.${fnName} logic not defined`)

        var {validate} = app.meanair.logic[logic][fnName]
        if (!validate && method != 'get')
          throw Error(`api:${method} endpoints require a validation function`)
        else if (validate)
          args.push(mw.data.valid(`${logic}.${fnName}`, argsMap, validate))

        args.push(mw.data.logic(logic, fnName, argsMap))

        router[method].apply(router, args)
      }
      return this
    }

  }


  return function(logic, opts) {
    var _api = {}

    opts = assign(opts||{}, {type:'api'})
    opts.params = []
    opts.mount = opts.baseUrl || `${config.middleware.api.baseUrl}/${logic}`

    var router = app.honey.Router(`${logic}:api`, opts)
      .use(mw.$.session)
      .use(mw.$.apiJson, {end:true})

    //-- deprecating soon
    for (var method of ['get','post','put','delete'])
      _api[method] = endpoints.call(_api, router, logic, method, opts.params)

    return assign(_api, {
      params(cfg) {
        if (cfg.constructor === String) cfg = cfg.split(' ')
        for (var paramKey of cfg) {
          var [paramName,queryKey] = paramKey.split(':')
          router.param(paramName, mw.data.param(paramName,{queryKey}))
          opts.params.push(paramName)
          // $log('API.added.param', paramName,)
        }
        return this
      },
      uses(names) {
        if (names.constructor === String) names = names.split(' ')
        for (var name of names) {
          if (!mw.Cached[name]) throw Error(`API.init fail. mw.${name} must be cached`)
          else router.use(mw.$[name])
        }
        return this
      }
    })
  }

}
