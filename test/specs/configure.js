var Configure = require('../../lib/configure')


module.exports = () => DESCRIBE("Config", function() {


  beforeEach(function(){
    for (var envVar in process.env) delete process.env[envVar]
  })


  IT('Default config fails with empty overrides', function() {
    var fn = () => Configure({}, 'dev')
    expect(fn).to.throw(Error, /Configure failed. Override or environment var required for config/)
    DONE()
  })


  IT('Default config with barest env variables', function() {
    process.env.AUTH_APPKEY = 'test2'
    process.env.AUTH_OAUTH_GITHUB_CLIENTID = 'ghtest2'
    process.env.AUTH_OAUTH_GITHUB_CLIENTSECRET = 'ghtest2-secret'
    process.env.AUTH_OAUTH_GITHUB_USERAGENT = 'ghtest2-ua'
    process.env.MODEL_MONGOURL = 'mongo://ghtest2/db'
    process.env.MODEL_SESSIONSTORE_COLLECTION = 'sessions-test2'
    var conf2 = Configure({}, 'dev')
    expect(conf2.env).to.equal('dev')
    expect(conf2.auth.loginUrl).to.equal('/')
    expect(conf2.auth.appKey).to.equal('test2')
    expect(conf2.auth.oauth.github.short).to.equal('gh')
    expect(conf2.auth.oauth.github.login).to.equal(true)
    expect(conf2.auth.oauth.github.signup).to.equal(true)
    expect(conf2.auth.oauth.github.emails).to.equal(true)
    expect(conf2.auth.oauth.github.logic).to.equal('oauth')
    expect(conf2.auth.oauth.github.clientID).to.equal('ghtest2')
    expect(conf2.auth.oauth.github.clientSecret).to.equal('ghtest2-secret')
    expect(conf2.auth.oauth.github.userAgent).to.equal('ghtest2-ua')
    expect(conf2.auth.oauth.github.callbackURL).to.equal('http://localhost:3333/auth/github/callback')
    expect(conf2.auth.oauth.github.scope.length).to.equal(1)
    expect(conf2.auth.oauth.github.scope[0]).to.equal('user')
    expect(conf2.http.port).to.equal(3333)
    expect(conf2.http.host).to.equal('http://localhost:3333')
    EXPECT.contains(conf2.http.static.dirs[0], 'web/public')
    expect(conf2.model.mongoUrl).to.equal('mongo://ghtest2/db')
    expect(conf2.model.sessionStore.collection).to.equal('sessions-test2')
    DONE()
  })


  IT('Undefine auth config section from overrides', function() {
    var overrides3 = { auth: undefined, http: {} }
    process.env.MODEL_MONGOURL = 'mongo://ghtest3/db'
    process.env.MODEL_SESSIONSTORE_COLLECTION = 'sessions-test3'

    var conf3 = Configure(overrides3, 'dev')
    expect(conf3.auth).to.be.undefined
    expect(conf3.http.host).to.equal('http://localhost:3333')
    expect(conf3.model.mongoUrl).to.equal('mongo://ghtest3/db')
    expect(conf3.model.sessionStore.collection).to.equal('sessions-test3')
    DONE()
  })


  IT('Undefine log.auth config section from environment', function() {
    var overrides31 = { auth: undefined, model: undefined }
    process.env.LOG_AUTH = '{{undefine}}'

    var conf31 = Configure(overrides31, 'dev')
    expect(conf31.auth).to.be.undefined
    expect(conf31.model).to.be.undefined
    expect(conf31.log).to.exist
    expect(conf31.log.auth).to.be.undefined
    DONE()
  })


  IT('Configures ok with config logging on', function() {
    var overrides0 = { auth: undefined }
    process.env.LOG_CFG_INIT = 'white'
    process.env.MODEL_MONGOURL = 'mongo://ghtest0/db'
    process.env.MODEL_SESSIONSTORE_COLLECTION = 'sessions-test0'
    var conf0 = Configure(overrides0, 'dev')
    DONE()
  })


  IT('Applies override values on top of default config', function() {
    var overrides4 = { auth: { oauth: { github: { signup: false } } }, model: undefined, wrappers: { timezone: { key: 'testtime' } } }
    process.env.AUTH_APPKEY = 'test4'
    process.env.AUTH_OAUTH_GITHUB_CLIENTID = 'ghtest4'
    process.env.AUTH_OAUTH_GITHUB_CLIENTSECRET = 'ghtest4-secret'
    process.env.AUTH_OAUTH_GITHUB_USERAGENT = 'ghtest4-ua'
    process.env.PORT = "4444"

    var conf4 = Configure(overrides4, 'dev')
    expect(conf4.auth.oauth.github.short).to.equal('gh')
    expect(conf4.auth.oauth.github.login).to.equal(true)
    expect(conf4.auth.oauth.github.signup).to.equal(false)
    expect(conf4.auth.oauth.github.emails).to.equal(true)
    expect(conf4.auth.oauth.github.clientID).to.equal('ghtest4')
    expect(conf4.auth.oauth.github.clientSecret).to.equal('ghtest4-secret')
    expect(conf4.auth.oauth.github.userAgent).to.equal('ghtest4-ua')
    expect(conf4.auth.oauth.github.callbackURL).to.equal('http://localhost:4444/auth/github/callback')
    expect(conf4.auth.oauth.github.scope.length).to.equal(1)
    expect(conf4.auth.oauth.github.scope[0]).to.equal('user')
    expect(conf4.wrappers.timezone.key).to.equal('testtime')
    DONE()
  })


  IT('Applies overrides value on top of default config sub-section', function() {
    var overrides42 = { log: { app: false }, model: undefined, auth: undefined }
    var conf42 = Configure(overrides42, 'dev')
    expect(conf42.log.app).to.equal(false)
    DONE()
  })


  IT('Add nested override where undefined default', function() {
    var overrides5 = { log: { test5: { theme: { run: 'white', error: 'red' } } }, auth: undefined, model: undefined }
    var conf5 = Configure(overrides5, 'dev')
    expect(conf5.log.test5.theme.run).to.equal('white')
    expect(conf5.log.test5.theme.error).to.equal('red')
    DONE()
  })


  IT('Add nested override false value where undefined default', function() {
    var overrides5 = { auth: { appKey: 'tt', oauth: { github: { unlink: false, relink: true, clientID: 'test', clientSecret: 'test', userAgent: 'tt5b' } } }, model: undefined }
    var conf5b = Configure(overrides5, 'dev')
    expect(conf5b.auth.oauth.github.relink).to.equal(true)
    expect(conf5b.auth.oauth.github.unlink).to.equal(false)
    DONE()
  })


  IT('Applies env var on top of override', function() {
    var overrides6 = { log: { test6: { theme: { run: 'blue', error: 'magentra' } } }, auth: undefined, model: undefined }
    process.env.LOG_TEST6_THEME_RUN = 'gray'
    process.env.LOG_TEST6_THEME_ERROR = 'white'
    var conf6 = Configure(overrides6, 'dev')
    expect(conf6.log.test6.theme.run).to.equal('gray')
    expect(conf6.log.test6.theme.error).to.equal('white')
    DONE()
  })


  IT('Applies env var on top of override from undefined default section', function() {
    var overrides7 = { auth: undefined, model: undefined, wrappers: { timezone: {key:'{{required}}' }} }
    process.env.WRAPPERS_TIMEZONE_KEY = 'whitetime'
    var conf7 = Configure(overrides7, 'dev')
    expect(conf7.wrappers.timezone.key).to.equal('whitetime')
    DONE()
  })

})
