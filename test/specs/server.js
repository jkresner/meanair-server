var MAServer = require('../../lib/index')


module.exports = () => DESCRIBE("PLUMBER", function() {

  beforeEach(function() {
    for (var envVar in process.env) delete process.env[envVar]
    if (global.Wrappers) delete global.Wrappers
    if (global._) delete global._
    if (global.$log) delete global.$log
    process.env.MIDDLEWARE_SESSION_STORE_COLLECTION = 'sessions'
  })


  IT('Globals set', function() {
    expect(global._).to.be.undefined
    expect(global.$log).to.be.undefined
    var cfg = MAServer.Config(__dirname.replace('specs','fixtures/app03'), "dev")
    expect(global.Wrappers.smtp).to.exist
    expect(global.Wrappers.ses).to.be.undefined
    expect(global.COMM).to.exist
    expect(global._).to.exist
    expect(global.$log).to.exist
    DONE()
  })


  SKIP('Config returned', function() {
    var github = { clientID: 'returnOfTheConfig', clientSecret: 'shhhhhh', emails: false, userAgent: 't2' }
    var appConfig = {
      auth:     { oauth: { github }, appKey: 'return' },
      comm:     undefined,
      http:     { host:'test2://mean.air/' },
      model:    { mongoUrl: 'yehaooouuu', sessionStore: undefined }
    }

    var instance = MAServer.Config(__dirname, "other")
    var config = setup.config
    expect(config).to.exist
    expect(config.auth.oauth.github.clientID).to.equal('returnOfTheConfig')
    expect(config.log).to.exist
    expect(config.http).to.exist
    expect(config.model.domain.mongoUrl).to.equal('yehaooouuu')
    DONE()
  })


})
