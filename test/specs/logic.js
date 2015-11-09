var Shared = require('../../lib/logic.shared')


module.exports = () => DESCRIBE("INDEX", function() {


  DESCRIBE("StatusError",  function() {


    IT('Correct http codes', function() {
      var shared = Shared(()=>"fakeId")
      var unauthortizedErr = shared.Unauthorized('yo')
      var forbiddenErr = shared.Forbidden('yo')
      var notFoundErr = shared.NotFound('yo')
      expect(unauthortizedErr.status).to.equal(401)
      expect(forbiddenErr.status).to.equal(403)
      expect(notFoundErr.status).to.equal(404)
      DONE()
    })



    IT('Can read message', function() {
      var shared = Shared(()=>"fakeId")
      var unauthortizedErr = shared.Unauthorized('yo')
      expect(unauthortizedErr.message).to.equal('yo')
      expect(unauthortizedErr.toString().indexOf('Error: yo')).to.equal(0)
      DONE()
    })


  })


})
