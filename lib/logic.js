var maShared = require('meanair-shared')
var Shared = require('./logic.shared')


module.exports = (plumber) => ({

  shared: null,


  init(model, dir) {
    this.shared = Object.assign(Shared(model.DAL), maShared)
    dir = dir || config.logic.dirs[0]
    return plumber.wireLogic(dir, model, this.shared)
  },


  extend(model, logic, dir) {
    var extensions = _.omit(plumber.wireLogic(dir, model, this.shared),'_DAL')

    for (var namespace in extensions) {
      if (!logic[namespace]) logic[namespace] = extensions[namespace]
      else {
        // console.log('namespace'.cyan, namespace, 'existing\n'.white, logic[namespace], 'extensions\n'.white, extensions[namespace])
        Object.assign(logic[namespace]._lib, extensions[namespace]._lib)
        // Extend parent app logic with extention logic but
        // allow the parent to priority to override functions
        Object.assign(logic[namespace], extensions[namespace]||{}, logic[namespace])
        //-- ** Cant use destructing assignment at the top of files
        //-- of base extension logic (e.g. consult/server/logic/loginConsult)
      }
    }

    return logic
  }


})

