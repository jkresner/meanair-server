module.exports = function(app, {dirs,layout}, {plumber}) {


  app.set('views', dirs.views)
  app.set('view engine', 'hbs')
  app.set('view options', { layout: layout || 'layout' })


  var hbs               = require('hbs')
  global.handlebars     = hbs.handlebars

  //-- Can access app.local.X and req.local.Y as @X and @Y
  hbs.localsAsTemplateData(app)

  for (var dir of dirs.partials||[])
    hbs.registerPartials(dir)

  var {SafeString} = handlebars
  hbs.registerHelper('JSON', val => JSON.stringify(val))
  for (var dir of dirs.helpers||[]) {
    var set = plumber.$requireDir(dir)
    for (var group in set) {
      for (var name in set[group]) hbs.registerHelper(name, function() {
          return new SafeString(set[group][name].apply(this,arguments))
        })
    }
  }


  global.marked            = require('marked')
  var md = marked.parse

  app.engine('md', function(str, opts, fn) {
    try {
      fn(null, md(str).replace(/\{([^}]+)\}/g, (_, name) => opt[name] || ''))
    } catch (e) {
      fn(e)
  }})


  $load(`INITED     View Engines`, dirs.views)
}
