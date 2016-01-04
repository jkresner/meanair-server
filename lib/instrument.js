// Adapted from https://github.com/nodejs/node/blob/b5cd2f098691935b6bef6ded1b0de7ef37431f27/lib/console.js
const util   = require('util')
var pretty;


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
  Object.defineProperty(this, '_timed', prop);
  prop.value = new Map();
  Object.defineProperty(this, '_stamps', prop);

  // bind the prototype functions to this Instrument instance
  var keys = Object.keys(Instrument.prototype);
  for (var v = 0; v < keys.length; v++) {
    var k = keys[v];
    this[k] = this[k].bind(this);
  }

  this._timed.set('app', Date.now());
}


Instrument.prototype.log = function() {
  this._stdout.write(util.format.apply(this, arguments) + '\n');
};


//-- like log, but prefixed to make it easier to spot
Instrument.prototype.debug = function() {
  var args = [].slice.call(arguments)
  args.unshift(pretty.colored('>>>','app_debug','gray'))
  this._stdout.write(util.format.apply(this, args) + '\n');
};


Instrument.prototype.logIt = function() {
  var args = [].slice.call(arguments)

  var scope = args.shift()
  var shouldLogIt = pretty.colors[scope] != null

  if (shouldLogIt) {
    var namespace = scope.split('.')[0]
    args[0] = pretty.format(args[0], 22, scope)
    args.unshift(pretty.format(namespace, 7, scope))
    this._stdout.write(util.format.apply(this, args) + '\n')
  }
};


Instrument.prototype.error = function(e) {
  if (global.config.env == "dev")
    this._stderr.write(util.format.call(this, pretty.error(e)))
  else
    this._stderr.write(util.format.apply(this, arguments))
};


Instrument.prototype.timed = function(label, msg) {
  var now = Date.now()
  var lastStamp = this._stamps.get(label)
  var start = this._timed.get(label)
  if (!start) this._timed.set(label, now)

  this.log('%s%s\t%s\t%s',
    pretty.format(label, 8, 'app.init'),
    pretty.format(now - (start||now), 6, 'app.lapse'),
    pretty.format(now - (lastStamp||now), 6, 'app.sublapse'),
    pretty.colored(msg,'app.init'));

  this._stamps.set(label, now)
};


Instrument.prototype.request = function(req, e, opts) {
  opts = opts || {}
  var prettyRequest = pretty.request(req, opts)

  this._stdout.write(util.format.call(this, prettyRequest))
  if (e)
    this.error(e)

  return util.format("%s %s", prettyRequest, e||'')
  // -- Revisit silentErrors mechanism retty soon
  // if (e && e.message && config.log.error.silence) {
  //   for (var silent of config.log.error.silence) {
  //     if (e.message.indexOf(silent) != -1) return
  //   }
  // }
};


module.exports = function(config) {

  pretty = require('./instrument.prettify')(config)
  return new Instrument(process.stdout, process.stderr)

}
