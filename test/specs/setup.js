var Setup = require('../../lib/index')


module.exports = () => DESCRIBE("Index", function() {


  IT('Globals set', function() {
    var overrides = {
      auth:     undefined,
      http:     { host:'test://mean.air/', sessionStore: undefined },
      mongoUrl: undefined
    }
    expect(global._).to.be.undefined
    expect(global.util).to.be.undefined
    expect(global.$log).to.be.undefined
    var setup = Setup("dev", overrides)
    expect(global._).to.exist
    expect(global.util).to.exist
    expect(global.$log).to.exist
    DONE()
  })


  IT('Config returned', function() {
    var github = { clientID: 'returnOfTheConfig', clientSecret: 'shhhhhh', emails: false, userAgent: 't2' }
    var overrides = {
      auth:     { oauth: { github }, appKey: 'return' },
      http:     { host:'test2://mean.air/', sessionStore:false },
      mongoUrl: 'yehaooouuu'
    }

    var setup = Setup("other", overrides)
    var config = setup.config
    expect(config).to.exist
    expect(config.auth.oauth.github.clientID).to.equal('returnOfTheConfig')
    expect(config.log).to.exist
    expect(config.http).to.exist
    expect(config.mongoUrl).to.equal('yehaooouuu')
    DONE()
  })


})
