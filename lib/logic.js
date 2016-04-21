var maShared = require('meanair-shared')
var Shared = require('./logic.shared')




module.exports = (queen) => ({

  shared: null,


  init(model, dir) {
    this.shared = assign(Shared(model.DAL), maShared)
    dir = dir || config.logic.dirs[0]
    return this.wireLogic(dir, model, this.shared)
  },


  wireLogic(dir, model, shared) {
    var {$require,$requireDir,$childDirs,$childJs} = queen

    var appShared = $requireDir(join(dir,'../','../','shared'), {strict:false})
    if (appShared)
      shared = assign(shared, appShared)
    // $log('appShared', appShared, join(dir,'../','../','shared'), shared)

    var logic = { _DAL: model.DAL }
    for (var namespace of $childDirs(dir)) {
      var nsDir = join(dir, namespace)
      var nsLogicFns = $childJs(nsDir)

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



  extend(model, logic, dir) {
    var extensions = _.omit(this.wireLogic(dir, model, this.shared),'_DAL')

    for (var namespace in extensions) {
      if (!logic[namespace]) logic[namespace] = extensions[namespace]
      else {
        // console.log('namespace'.cyan, namespace, 'existing\n'.white, logic[namespace], 'extensions\n'.white, extensions[namespace])
        assign(logic[namespace]._lib, extensions[namespace]._lib)
        // Extend parent app logic with extention logic but
        // allow the parent to priority to override functions
        assign(logic[namespace], extensions[namespace]||{}, logic[namespace])
        //-- ** Cant use destructing assignment at the top of files
        //-- of base extension logic (e.g. consult/server/logic/loginConsult)
      }
    }

    return logic
  }


})



