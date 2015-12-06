var {Setup} = require('../../lib/index')


module.exports = () => DESCRIBE("Index", function() {

  beforeEach(function(){
    if (global._) delete global._
    if (global.$log) delete global.$log
  })




  IT('Globals set', function() {
    var overrides = {
      auth:     undefined,
      http:     { host:'test://mean.air/' },
      model:    undefined
    }
    expect(global._).to.be.undefined
    expect(global.$log).to.be.undefined
    var setup = Setup(overrides, "dev")
    expect(global._).to.exist
    expect(global.$log).to.exist
    DONE()
  })


  IT('Config returned', function() {
    var github = { clientID: 'returnOfTheConfig', clientSecret: 'shhhhhh', emails: false, userAgent: 't2' }
    var overrides = {
      auth:     { oauth: { github }, appKey: 'return' },
      http:     { host:'test2://mean.air/' },
      model:    { mongoUrl: 'yehaooouuu', sessionStore: undefined }
    }

    var setup = Setup(overrides, "other")
    var config = setup.config
    expect(config).to.exist
    expect(config.auth.oauth.github.clientID).to.equal('returnOfTheConfig')
    expect(config.log).to.exist
    expect(config.http).to.exist
    expect(config.model.mongoUrl).to.equal('yehaooouuu')
    DONE()
  })


})
