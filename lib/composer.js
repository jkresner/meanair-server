'use strict';

var {handlebars} = require('hbs')
var {firstName} = require('meanair-shared').TypesUtil.String


//-- Assume all templates are available in cache
class Composer {


  constructor(config) {
    this.compiled = {}
  }


  validateTemplateTransport(template, transport) {
    if (!template) return `not in cache`
    if (!template[transport]) return `has no ${transport} definition`
  }


  getCompiledTemplate(transport, templateName) {
    if (transport == 'smtp' || transport == 'ses') transport = 'mail'
    var key = `${templateName}.${transport}`
    if (this.compiled[key]) return this.compiled[key]

    var template = cache.templates[templateName]
    var invalid = this.validateTemplateTransport(template, transport)
    if (invalid) throw Error(`Template[${key}] fail. ${invalid}`)

    this.compiled[key] = {}
    for (var attr in template[transport])
      this.compiled[key][attr] = handlebars.compile(template[transport][attr])

    return this.compiled[key]
  }


  render({template, data, to, sender}) {
    var tmplData = Object.assign({ firstName: firstName(to.name) }, data)
    var rendered = {}
    for (var attr in template)
      rendered[attr] = template[attr](tmplData)

      return rendered
  }


  handlebarIt(tmplString, data) {
    return handlebars.compile(tmplString)(data)
  }

}


module.exports = (config) => new Composer(config)
