var sError = status => msg => Object.assign(new Error(msg), {status})


module.exports = function(DAL) {

  var ID = () => DAL.User.newId()

  var Touch = (action, user) => ({
    action,
    _id:      ID(),
    utc:      new Date(),   // TODO, remove utc after a migration
    by:       { _id: user._id, name: user.name }
  })

  return {
    touchMeta(meta, action, user) {
      if (!meta)
        meta = { activity:[] }
      var touch = Touch(action, user)
      meta.lastTouch = touch
      meta.activity.push(touch)
      return meta
    },
    StatusError:   sError,
    Unauthorized:  sError(401),
    Forbidden:     sError(403),
    NotFound:      sError(404)
  }

}
