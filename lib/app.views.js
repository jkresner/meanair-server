module.exports = (config, app) => {

  var cfg = config.views

  app.set('views', cfg.dirs)
  app.set('view engine', cfg.engine)

  if (cfg.engine != 'hbs')
    throw Error("Non .hbs view engine not yet supported by meanair.server")
  else {
    var hbs = require('hbs')
    hbs.registerHelper('JSON', val => JSON.stringify(val))
    hbs.localsAsTemplateData(app)
  }

  $load(`INITED     View Engine (${cfg.engine})`)

}
