var {join}                   = require('path')

var syntax = require('syntax-error')
var fs = require('fs')
var isDir = (dir) => fs.statSync(dir).isDirectory()
var filterDir = (dir,filter) => fs.readdirSync(dir).filter(filter)
var childDirs = (dir) => filterDir(dir, f=>isDir(join(dir,f)))
var childJs = (dir) =>
      filterDir(dir, f=>f.match(/\.js$/))
        .filter(f => f.indexOf('_') != 0)  //-- meanair convention exclude files like _data.js
        .map(n=>n.replace('.js',''))


//-- like require with:
//--   + dependecy injection
//--   + instrumentation
//--   + (TODO) lazy loading
function $require(dir, file, dependencies) {
  var requiredFile = join(dir,file)
  try {
    var req = require(requiredFile)
    $logIt('app.require', `require`, `${dependencies?'wDeps'.yellow.dim:''}`.reset + requiredFile.gray)
    return dependencies ? req.apply(this,dependencies) : req
  } catch (e) {
    if (e.stack.match('SyntaxError')) {
      var src = fs.readFileSync(requiredFile+'.js')
      var err = syntax(src, requiredFile)
      console.log('\n\n$require.SyntaxError'.red, e.message.gray,
        err ? `\n\t${err} | col ${err.column}\n\n\n\n`.red : requiredFile.white)
      process.exit(1)
    }
    else
      console.log('\n\n\n$require.err'.red, requiredFile.white, e.message, '\n\n\n')

    throw e
  }

}


function $requireDir(dir, opts) {
  if (!opts) opts = { strict: true }
  var {files,dependencies} = opts

  try {
    if (!isDir(dir) && !opts.strict)
      return null
  } catch (e) {
    if (e.message.indexOf('ENOENT')==0)
      return null
  }

  files = files || childJs(dir)

  $logIt('app.require', `requireDir`, `${dependencies?'wDeps'.yellow.dim:''}`.reset+dir.white)

  var required = {}
  files.forEach(f => required[f] = $require(dir.toLowerCase(),f, dependencies))

  return required
}



function wireWrapper(dir, fileName) {
  var wrapper = $require(dir, fileName)
  var name = wrapper.name || fileName

  //-- Combine multiple wrappers into a "Super" wrapper :)
  if (Wrappers[name]) {
    throw Error("Combining wrappers with the same name not implemented.")
    //-- Get it over and done with since we're about
    //-- to discard init from the new wrapper anyway
    // wrapper.init()
    // Object.assign(Wrappers[name].api, wrapper.api)
    // $log('Wrappers[name].api', Wrappers[name].api)
    // global.Wrappers[name] = Object.assign(wrapper, Wrappers[name])
    // $logIt('app.wire', 'extendedWrapper', dir, Wrappers[name])
  }
  //-- All wrappers have an inner api property which is a 3rd
  //-- party module that we want to usually stub when testing.
  //-- Here we're making our wrapper lazy load on the first time
  //-- a function is called on it.
  else
  {
    var wrapped = (fn, fnName) => function() {
      if (!Wrappers[name].api) {
        Wrappers[name].init()
        $logIt('wrpr.init', 'init', name, fnName)
      }
      return fn.apply(this, arguments)
    }

    global.Wrappers[name] = { init: wrapper.init }
    for (var fn in wrapper) {
      if (fn != 'init' && fn != 'name')
        global.Wrappers[name][fn] = wrapped(wrapper[fn], fn)
    }

    $logIt('app.wire', `wiredWrapper:${name}`, _.keys(Wrappers[name]))
  }
}


module.exports = {

  $require,
  $requireDir,
  $childDirs: childDirs,
  $childJs: childJs,

  setGlobals(config) {
    global.config         = config

    var instrument        = require('./instrument')(config)
    global.$log           = instrument.debug
    global.$logIt         = instrument.logIt
    global.$error         = instrument.error
    global.$request       = instrument.request
    // global.$time          = instrument.time

    global.$load = msg => config.log.app && config.log.app.init
                            ? instrument.timed('app', msg) : 0

    global.assign         = Object.assign
    global.join           = require('path').join
    global.moment         = require('moment-timezone')
    var TypesUtil         = require('meanair-shared').TypesUtil
    var _                 = require('lodash')
    _.idsEqual            = TypesUtil.BSONID.equal
    _.selectFromObj       = TypesUtil.Object.select
    _.cloneObj            = TypesUtil.Object.clone //-- remove 0.6.5
    global._              = _


    // temp UGLY global
    global.LogicDataHelper = require('./logic.data')

    global.Composer = require('./composer')(config)

    if (config.wrappers) {
      for (var dir of config.wrappers.dirs||[])
        this.wireWrappers(dir.replace('wrappers',''))
      if (config.comm)
        global.COMM = require('./comm')(config)
    }
  },


  //-- Hybrid wire + extend logic
  wireWrappers(dir) {
    global.Wrappers = global.Wrappers || {}
    var wrapperDir = join(dir,'wrappers')
    var files = childJs(wrapperDir)
    // $log('plumber.wireWrappers', wrapperDir, files)
    // var wireOne = (dir, f) => () => wireWrapper(dir, f)

    for (var fileName of files)
      wireWrapper(wrapperDir, fileName)
      // -- Speeds app load plenty with more than a couple wrappers
      // setTimeout(wireOne(wrapperDir, fileName))
  },



}

