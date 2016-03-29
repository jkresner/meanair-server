var {join}                   = require('path')


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
    console.log('\n\n\n$require fail'.red, requiredFile.white, '\n\n\n')
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

    global.marked         = require('marked')
    global.moment         = require('moment-timezone')
    var TypesUtil         = require('meanair-shared').TypesUtil
    var _                 = require('lodash')
    _.idsEqual            = TypesUtil.BSONID.equal
    _.selectFromObj       = TypesUtil.Object.select
    _.cloneObj            = TypesUtil.Object.clone
    global._              = _
    global.assign         = Object.assign


    if (config.model && config.model.cache)
      global.cache = require('./cache')

    // temp
    global.LogicDataHelper = require('./logic.data')

    global.Composer = require('./composer')(config)

    if (config.wrappers) {
      for (var dir of config.wrappers.dirs||[])
        this.wireWrappers(dir.replace('wrappers',''))
      if (config.comm)
        global.COMM = require('./comm')(config)
    }
  },


  wireLogic(dir, model, shared) {
    var appShared = $requireDir(join(dir,'../','../','shared'), {strict:false})
    if (appShared)
      shared = Object.assign(shared, appShared)
    // $log('appShared', appShared, join(dir,'../','../','shared'), shared)

    var logic = { _DAL: model.DAL }
    for (var namespace of childDirs(dir)) {
      var nsDir = join(dir, namespace)
      var nsLogicFns = childJs(nsDir)

      var dataFns = $require(nsDir,'_data')
      //-- super ugly hack
      var daName = namespace[0].toUpperCase() + namespace.replace(namespace[0],'').replace(/s$/,'')
      var matchingDA = model.DAL[daName] || model.DAL.User
      if (matchingDA)
        dataFns.Project.newId = matchingDA.newId
      //-- end: ugly

      var dependencies = [model.DAL, dataFns, shared]
      // $log('beforeLib'.yellow, namespace)
      var libFns = $requireDir(join(nsDir,'lib'), {strict:false})
      // $log('afterLib.req'.yellow, namespace)
      //-- initialize by invoking em with all deps
      var lib = {}
      dependencies.push(lib)
      if (libFns) Object.keys(libFns).forEach(
          fn => lib[fn] = libFns[fn].apply(null, dependencies))


      logic[namespace] = $requireDir(nsDir, {files:nsLogicFns,dependencies})
      logic[namespace]._lib = lib
    }

    $logIt('app.wire', 'wiredLogic', dir, '\n', _.omit(logic, '_DAL'))
    return logic
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


  cacheMiddleware(app, MW, dirs) {
    var mw = {}
    var dependencies = [app, MW]
    for (var dir of dirs)
      Object.assign(mw, $requireDir(dir, {dependencies,strict:false}))
    $logIt('app.wire', 'cacheMiddleware', _.keys(MW.$), dir)
    return mw
  },


  wireRoutes(app, dirs, redirects) {
    var dependencies = [app]
    if (app.meanair.middleware) dependencies.push(app.meanair.middleware)
    if (redirects) dependencies.push(redirects)

    for (var dir of dirs) {
      var routes = $requireDir(dir, {dependencies})
      $logIt('app.wire', 'wiredRoutes', _.keys(routes), dir)
    }
  }


}

