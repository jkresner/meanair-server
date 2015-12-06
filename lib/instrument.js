// Adapted from https://github.com/nodejs/node/blob/b5cd2f098691935b6bef6ded1b0de7ef37431f27/lib/console.js
const util = require('util')
var colors = require('colors')
var $color = (str, key) => colors[key] ? str.toString()[key] : str


function fixed(str, width, color) {
  var padding = ''
  while (padding.length+str.length < width-1)
    padding+=' '
  var fixStr = (str+padding).slice(0,width-1)+' '
  return color ? fixStr[color] : fixStr
}


function Instrument(stdout, stderr) {
  if (!(this instanceof Instrument)) {
    return new Instrument(stdout, stderr);
  }
  if (!stdout || typeof stdout.write !== 'function') {
    throw new TypeError('Instrument expects a writable stream instance');
  }
  if (!stderr) {
    stderr = stdout;
  }
  var prop = {
    writable: true,
    enumerable: false,
    configurable: true
  };
  prop.value = stdout;
  Object.defineProperty(this, '_stdout', prop);
  prop.value = stderr;
  Object.defineProperty(this, '_stderr', prop);
  prop.value = new Map();
  Object.defineProperty(this, '_times', prop);
  prop.value = new Map();
  Object.defineProperty(this, '_stamps', prop);

  // bind the prototype functions to this Instrument instance
  var keys = Object.keys(Instrument.prototype);
  for (var v = 0; v < keys.length; v++) {
    var k = keys[v];
    this[k] = this[k].bind(this);
  }

  this._times.set('app', Date.now());
}


Instrument.prototype.debug = function() {
  var args = [].slice.call(arguments)
  if (global.config && config.log
                    && config.log.debug
                    && config.log.debug.log) {
    args.unshift('>>>'[config.log.debug.log])
  }
  this._stdout.write(util.format.apply(this, args) + '\n');
};


Instrument.prototype.log = function() {
  this._stdout.write(util.format.apply(this, arguments) + '\n');
};


Instrument.prototype.shouldLogIt = function(namespace, feature) {
  if (feature == null) {
    var scope = namespace.split('.')
    namespace = scope[0]
    feature = scope[1]
  }

  return global.config &&
         config.log &&
         config.log[namespace] &&
         config.log[namespace][feature]
};


Instrument.prototype.logIt = function() {
  var args = [].slice.call(arguments)
  var scope = args.shift().split('.')
  var namespace = scope[0]
  var feature = scope[1]

  if (this.shouldLogIt(namespace, feature)) {
    var themeColor = config.log[namespace][feature]
    args[0] = fixed(args[0], 22, themeColor)
    args.unshift(fixed(namespace, 7, themeColor))
    this._stdout.write(util.format.apply(this, args) + '\n');
  }
};


Instrument.prototype.error = function(e, opts) {
  var opts = opts || {}
  opts.minimal = opts.minimal || global.config && config.env == "dev"

  // if (opts.minimal) {
  //   var output = _.take(e.stack.split('\n').filter(ln => ln.indexOf('node_modules') == -1 ), 20)
  //       .map(str => str.replace("  at ", ''))
  //       .map(str => str.replace("(",'').replace(")",'').split(' '))
  //       .map(words => words[0].red + ' ' + _.rest(words,1).join(' ').white)
  //       .join('\n  ') + '\n'
  //   if (opts.silent !== true)
  //     this._stderr.write(util.format.call(this, output));
  //   return output
  // }
  // else
    this._stderr.write(util.format.apply(this, arguments) + '\n');
};


Instrument.prototype.time = function(label) {
  this._times.set(label, Date.now());
};


Instrument.prototype.timeLapse = function(label, msg) {
  var now = Date.now();
  var start = this._times.get(label);
  if (!start) {
    throw new Error('No such label: ' + label);
  }
  var lastStamp = this._stamps.get(label)
  this._stamps.set(label, lastStamp ? now : start)

  var lapse = now - start
  var sublapse = now - (lastStamp || start)
  this.log('%s%s\t%s\t%s',
    $color(fixed(label,8),`appinit`),
    $color(lapse,`applapse`),
    $color(sublapse,`appsublapse`),
    $color(msg,`appinit`));
};


Instrument.prototype.timeEnd = function(label) {
  var time = this._times.get(label);
  if (!time) throw new Error('No such label: ' + label);
  var duration = Date.now() - time;
  this.log('%s: %dms', label, duration);
};


Instrument.prototype.trace = function trace() {
  var err = new Error();
  err.name = 'Trace';
  err.message = util.format.apply(this, arguments);
  Error.captureStackTrace(err, trace);
  this.error(err.stack);
};


Instrument.prototype.request = function request(req, e, {silent}) {
  // -- Revisit this mechanism pretty soon
  // if (e && e.message && config.log && config.log.error.silence) {
  //   for (var silentError of config.log.error.silence) {
  //     if (e.message.indexOf(silentError) != -1) return
  //   }
  // }

  var output = util.format('%s %s\n%s\n%s',
    req.method, `${req.originalUrl} << ${req.header('Referer')}`,
    req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    req.user ? `${req.user.name} ${req.user._id}` : req.sessionID)

  if (e) {
    output = util.format('%s\n%s', e.message||e, output);

    if (req.header('user-agent'))
      // var isBot = (util.isBot(req.header('user-agent'))) ? 'true' : 'false'
      output += `\n isBot:${'maybe'}:${req.header('user-agent')}`
    if (req.method != 'GET' && req.body)
      output += `\n\n ${JSON.stringify(req.body)}`
    if (e.stack)
      output += `\n\n ${e.stack}`

    if (!silent) { this.error(output) }
  }
  else if (!silent) {
    this.log(output)
  }

  return output
};


module.exports = function(config) {

  //-- Flatten logConfig to pass intto colors.setTheme
  var theme = {}
  for (var namespace in config.log)
    Object.keys(config.log[namespace]).forEach(feature =>
      theme[namespace+feature] = config.log[namespace][feature])

  colors.setTheme(theme)

  return new Instrument(process.stdout, process.stderr)
}
