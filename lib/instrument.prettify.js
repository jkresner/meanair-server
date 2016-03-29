var colors   = require('colors')
const util   = require('util')

//-- Flatten  global.config.log.{ns}.{feature}
//-- to       flattened[`{ns}.{feature}`]
//-- to pass into colors.setTheme()
function setColorThemes(cfg) {

  var flattened = {}
  for (var namespace in cfg)
    Object.keys(cfg[namespace]).forEach(feature =>
      flattened[namespace+'.'+feature] = cfg[namespace][feature])

  colors.setTheme(flattened)

}


function fixed(input, width) {
  var padding = ''
  while (padding.length+input.length < width-1)
    padding+=' '
  return (input+padding).slice(0,width-1)+' '
}


function colored(input, key, defalt) {
  if (!input.constructor || input.constructor !== String)
    input = input.toString()

  return colors[key] ? input[key]
                     : (defalt ? input[defalt] : input)
}


function error(e, maxLines) {
  return _.take(e.stack.split('\n')
      .filter(ln => !ln.match('node_modules|native') || ln.match('meanair'))
      , maxLines||20)
    .map(str => str.replace("  at ", ''))
    .map(str => str.replace("(",'').replace(")",'').split(' '))
    .map(words => words[0].red + ' ' + _.rest(words,1).join(' ').white)
    .join('\n  ')
}


function request(req, {body,bot}) {
  var str = util.format('[%s%s]%s\n%s\n%s\n%s\n\n',
    req.method, `${req.originalUrl}`,
    req.header('Referer') ? `\n<< ${req.header('Referer')}` : '',
    (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0],
    req.header('user-agent')?req.header('user-agent'):'UA:null',
    req.user ? `${req.user.name} ${req.user._id}` : req.sessionID)

  if (bot) str += (`\n bot:` +
    req.header('user-agent') ? (req.ctx&&req.ctx.bot!=undefined?req.ctx.bot:'maybe') : 'UA:null')

  if (body && !req.method.match(/(get|delete)/i))
    str += `\n\n ${JSON.stringify(req.body)}`

  return str
}


module.exports = function(config) {

  setColorThemes(config.log)

  return {
    colors,
    colored,
    error,
    fixed,
    format: (input, width, colorKey, colorDefault) =>
      colored(fixed(`${input}`, width), colorKey, colorDefault),
    request
  }

}
