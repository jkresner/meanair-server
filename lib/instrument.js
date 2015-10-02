'use strict';

var colors = require('colors')
var $color = (str, colorKey) =>
  colors[colorKey] ? str.toString()[colorKey] : str

// Copies from https://github.com/nodejs/node/blob/b5cd2f098691935b6bef6ded1b0de7ef37431f27/lib/console.js
const util = require('util')

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


Instrument.prototype.log = function() {
  this._stdout.write(util.format.apply(this, arguments) + '\n');
};


Instrument.prototype.error = function() {
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
  this.log('%s\t%s\t%s\t%s',
    $color(label,`app${label}`),
    $color(lapse,`applapse`),
    $color(sublapse,`appsublapse`),
    $color(msg,`app${label}`));
};


Instrument.prototype.timeEnd = function(label) {
  var time = this._times.get(label);
  if (!time) {
    throw new Error('No such label: ' + label);
  }
  var duration = Date.now() - time;
  this.log('%s: %dms', label, duration);
};


Instrument.prototype.trace = function trace() {
  // TODO probably can to do this better with V8's debug object once that is
  // exposed.
  var err = new Error();
  err.name = 'Trace';
  err.message = util.format.apply(this, arguments);
  Error.captureStackTrace(err, trace);
  this.error(err.stack);
};


Instrument.prototype.request = function request(req, e) {
  if (e && e.message && config.log.error.silence) {
    for (var silentError of config.log.error.silence) {
      if (e.message.indexOf(silentError) != -1) return
    }
  }

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

    this.error(output);
  }
  else
    this.log(output);

  return output
};


module.exports = function(config) {

  var theme = {}
  Object.keys(config||{}).forEach(function(key) {
    var subTheme = config[key] ? config[key].theme || {} : {}
    Object.keys(subTheme).forEach(function(subKey) {
      var colorKey = key+subKey
      theme[colorKey] = subTheme[subKey]
    })
  })

  //-- Helper to color according to customer key (if it exists)

  colors.setTheme(theme)

  return new Instrument(process.stdout, process.stderr)
}
