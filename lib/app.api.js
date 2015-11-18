'use strict';

module.exports = (config, app, mw) => {

var endpoints = function(logic, method) {
  return (opts, cfg) => {
    if (!cfg) {
      cfg = opts
      opts = {}
    }
    for (var fnName in cfg) {
      var url = '/'+fnName.replace(/get|update|create|delete/,'').toLowerCase()
      var argsMap = cfg[fnName].split(' ').filter(elm=>elm!='').map(map => {
        var isParams = map.indexOf('params.')===0
        if (isParams)
          url += `/:${map.replace('params.','').split(':')[0]}`
        var isParam = isParams && map.indexOf(':')!==-1
        return isParam ? map.split(':')[1] :  map
      })
      var params = [url]
      if (opts.use) {
        for (var entpointsMiddleware of opts.use.split(' '))
          params.push(mw.$[entpointsMiddleware])
      }
      params.push(mw.data.logic(logic, fnName, argsMap))
      this.router[method].apply(this.router, params)
      $logIt('conf.routes', `api:${method.toUpperCase()}`, `${this.baseUrl}${url}`)
    }
    return this
  }
}


class appApi {

  constructor(logic, opts) {
    if (!opts) opts = {}
    this.baseUrl = opts.baseUrl || `${config.middleware.api.baseUrl}/${logic}`
    this.router = app.Router()

    for (var method of ['get','post','put','delete'])
      this[method] = endpoints.call(this, logic, method)
  }

  params(cfg) {
    if (cfg.constructor === String) cfg = cfg.split(' ')
    for (var paramKey of cfg) {
      var [paramName,model,queryKey] = paramKey.split(':')
      this.router.param(paramName, mw.data.param(model,queryKey))
    }
    return this
  }

  middleware(cfg) {
    if (cfg.constructor === String) cfg = cfg.split(' ')
    for (var apiMiddleware of cfg) {
      if (!mw.Cached[apiMiddleware])
        throw Error(`API init fail. mw.${apiMiddleware} must first be cached.`)
      this.router.use(mw.$[apiMiddleware])
    }
    return this
  }

  end(cfg) {
    this.middleware(cfg||'apiJson')
    app.use(this.baseUrl, this.router)
  }

}


return (logic, opts) => new appApi(logic, opts)

}
