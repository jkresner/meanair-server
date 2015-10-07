var Fs                       = require('fs')
var Path                     = require('path')


module.exports = function() {

  var hooks = {


    $require: function(dir, file, dependencies) {

      //-- TODO add trace wrapper and lazy loading
      var req = require(`${dir}/${file}`)
      return dependencies ? req.apply(this,dependencies) : req

    },


    $requireIndex: function(dir, files, dependencies) {

      if (files === 'alljs') {

        try {
          var stat = Fs.statSync(dir)
          // $log('fstat', dir, stat.isDirectory())
          if (!stat.isDirectory()) return null
        } catch (e) {
          if (e.message.indexOf('ENOENT')==0)
            return null
        }

        var fileNames = Fs.readdirSync(dir)
                          .filter(f => f.indexOf('.js') === f.length-3)

        files = fileNames.map(f => f.replace('.js',''))
      }

      // $log('files', files)

      //-- TODO add trace wrapper and lazy loading
      var index = {}
      files.forEach(function(file){
        index[file] = hooks.$require(dir.toLowerCase(),file,dependencies)
      })

      return index

    },


    $requireLogic: function(logicDir, dataAccessLayer) {

      var sharedLogic = require('./logic')(dataAccessLayer)
      var logic = { DA: dataAccessLayer }

      var namespaces = Fs.readdirSync(logicDir)
                         .filter(f => Fs.statSync(Path.join(logicDir,f)).isDirectory())

      for (var namespace of namespaces) {
        var dir = Path.join(logicDir,namespace).toLowerCase()
        var dirLib = Path.join(dir,'lib')

        var nsDataFns = $require(dir,'_data')
        var nsDependencies = [dataAccessLayer, nsDataFns, sharedLogic]
        var nsLibFns = $requireIndex(dirLib, 'alljs', nsDependencies)
        if (nsLibFns) nsDependencies.push(nsLibFns)


        var nsFns = Fs.readdirSync(dir)
                      .filter(f => f.indexOf('.js') === f.length-3)
                      .filter(f => f.indexOf('_') !== 0)
                      .map(f => f.replace('.js',''))

        logic[namespace] = hooks.$requireIndex(dir, nsFns, nsDependencies)

        // console.log(`logic.${namespace}`.cyan, logic[namespace])
      }

      return logic

    }

  }


  return hooks

}
