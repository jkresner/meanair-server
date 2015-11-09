var Shared = require('./logic.shared')

module.exports = (plumber) => ({


  init(model, dir) {
    dir = dir || config.logic.dir
    return plumber.wireLogic(dir, model, Shared(model.DAL))
  },


  extend(model, logic, dir) {
    var extensions = _.omit(plumber.wireLogic(dir, model, Shared(model.DAL)),'_DAL')

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

