'use strict';

module.exports = (app, mw, cfg) => {

var endpoints = function(logic, method) {

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

      var params = [url]

      if (!app.meanair.logic[logic][fnName])
        throw Error(`api:${logic.gray}.${fnName.white} logic not defined`)

      var {validate} = app.meanair.logic[logic][fnName]
      if (!validate && method != 'get')
        throw Error(`api:${method} endpoints require a validation function`)
      else if (validate)
        params.push(mw.data.valid(`${logic}.${fnName}`, argsMap, validate))

      params.push(mw.data.logic(logic, fnName, argsMap))

      this.router[method].apply(this.router, params)
    }
    return this
  }
}


class appApi {

  constructor(logic, opts) {
    this.opts = assign(opts||{}, { params:[] })
    this.baseUrl = this.opts.baseUrl || `${cfg.baseUrl}/${logic}`

    this.router =
      app.honey.Router(`${logic}:api`, {mount:this.baseUrl,type:'api'})
        .use(mw.$.session)
        .use(mw.$.apiJson, {end:true})

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

  use(mw) {
    return this.router.use(mw)
  }

  uses(cfg) {
    if (cfg.constructor === String) cfg = cfg.split(' ')
    for (var name of cfg) {
      if (!mw.Cached[name]) throw Error(`API.init fail. mw.${name} must be cached`)
      else this.router.use(mw.$[name])
    }

    return this
  }

}


return (logic, opts) => new appApi(logic, opts)

}
