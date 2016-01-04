'use strict';

module.exports = (config, app, mw) => {

var endpoints = function(logic, method) {
  var tracking = global.analytics.tracking || {}
  return (opts, cfg) => {
    if (!cfg) {
      cfg = opts
      opts = {}
    }
    for (var fnName in cfg) {
      var url = ('/'+fnName).replace(/get|update|create|delete/,'')
        .toLowerCase().replace(/\/$/,'')

      var argsMap = cfg[fnName].split(' ').filter(elm=>elm!='').map(map => {
        if (map.indexOf('params.') == 0 || this.opts.params.indexOf(map) != -1)
          url += `/:${map.replace('params.','').split(':')[0]}`

        return map
      })

      if (!app.meanair.logic[logic][fnName])
        throw Error(`api:${logic.gray}.${fnName.white} logic not defined`)

      var {validate} = app.meanair.logic[logic][fnName]
      if (!validate && method != 'get')
        throw Error(`api:${method} endpoints require a validation function`)

      var params = [url]
      for (var entpointsMiddleware of (opts.use?opts.use.split(' '):[]))
        params.push(mw.$[entpointsMiddleware])
      if (validate)
        params.push(mw.data.valid(`${logic}.${fnName}`, argsMap, validate))

      params.push(mw.data.logic(logic, fnName, argsMap))

      if (tracking[fnName])
        params.push(mw.analytics.event(fnName,
          global.analytics.event, { project: tracking[fnName] }))

      params.push(mw.$.apiJson)

      this.router[method].apply(this.router, params)
      $logIt('cfg.route', `api:${method}`, `${this.baseUrl}${url}`)
    }
    return this
  }
}


class appApi {

  constructor(logic, opts) {
    this.opts = Object.assign(opts||{}, { params:[] })
    this.baseUrl = this.opts.baseUrl || `${config.middleware.api.baseUrl}/${logic}`
    this.router = app.Router()

    for (var method of ['get','post','put','delete'])
      this[method] = endpoints.call(this, logic, method)
  }

  params(cfg) {
    if (cfg.constructor === String) cfg = cfg.split(' ')
    for (var paramKey of cfg) {
      var [paramName,queryKey] = paramKey.split(':')
      this.router.param(paramName, mw.data.param(paramName,{queryKey}))
      this.opts.params.push(paramName)
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
    if (cfg) this.middleware(cfg)
    app.use(this.baseUrl, this.router)
  }

}


return (logic, opts) => new appApi(logic, opts)

}
