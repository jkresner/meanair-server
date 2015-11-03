var StatusError = require('../../lib/statusErrors')()


module.exports = () => DESCRIBE("StatusErrors", function() {


  IT('Correct http codes', function() {
    var unauthortizedErr = StatusError.Unauthorized('yo')
    var forbiddenErr = StatusError.Forbidden('yo')
    var notFoundErr = StatusError.NotFound('yo')
    expect(unauthortizedErr.status).to.equal(401)
    expect(forbiddenErr.status).to.equal(403)
    expect(notFoundErr.status).to.equal(404)
    DONE()
  })


})
