module.exports = function(DataAccessLayer) {


  var touchId = () => DataAccessLayer.User.newId()

  var touching = {

    Touch(action, user) {
      return {
        action,
        _id:      touchId(),
        utc:      new Date(),
        by:       { _id: user._id, name: user.name }
      }
    },

    touchMeta(meta, action, user) {
      if (!meta)
        meta = { activity:[] }
      var touch = touching.Touch(action, user)
      meta.lastTouch = touch
      meta.activity.push(touch)
      return meta
    }

  }


  var statusErrors           = require('./statusErrors')()


  return Object.assign(touching, statusErrors)


}
