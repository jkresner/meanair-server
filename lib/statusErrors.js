module.exports = function() {


  var StatusError = (message, status) => {
    var e = new Error(message)
    e.status = status
    return e
  }


  return {
    StatusError,

    Unauthorized:  (msg) => StatusError(msg, 401),
    Forbidden:     (msg) => StatusError(msg, 403),
    NotFound:      (msg) => StatusError(msg, 404)
  }


}
