module.exports = function() {

  var hooks = {

    $require: function(dir, file, dependencies) {

      //-- TODO add trace wrapper and lazy loading
      var req = require(`${dir}/${file}`)
      return dependencies ? req.apply(this,dependencies) : req

    },

    $requireIndex: function(dir, files, dependencies) {

      //-- TODO add trace wrapper and lazy loading
      var index = {}
      files.forEach(function(file){
        index[file] = hooks.$require(dir.toLowerCase(),file,dependencies)
      })

      return index

    }
  }


  return hooks

}
