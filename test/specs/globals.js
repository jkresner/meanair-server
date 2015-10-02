var Setup = require('../../lib/setup')


module.exports = () =>


DESCRIBE("Setup", function() {


  IT('Globals set', function() {
    expect(global._).to.be.undefined
    expect(global.util).to.be.undefined
    expect(global.$log).to.be.undefined
    var overrides = {}
    var setup = Setup("other", overrides)
    expect(global._).to.exist
    expect(global.util).to.exist
    expect(global.$log).to.exist
    DONE()
  })


  IT('Config returned', function() {
    var overrides = {}
    var setup = Setup("other", overrides)
    var config = setup.config
    expect(config).to.exist
    expect(config.auth).to.exist
    expect(config.log).to.exist
    expect(config.http).to.exist
    expect(config.mongoUrl).to.exist
    DONE()
  })


})
