var Configure = require('../../lib/configure')
var {join}    = require('path')

module.exports = () => DESCRIBE("Config", function() {


  beforeEach(function(){
    for (var envVar in process.env) delete process.env[envVar]
  })


  IT('Configure fails on unset {{required}} value', function() {
    var fn = () => Configure({}, 'dev')
    expect(fn).to.throw(Error, /Configure failed. Override or environment var required for config/)
    DONE()
  })


  IT('Defaults with barest env vars applied', function() {
    process.env.AUTH_APPKEY = 'test2'
    process.env.AUTH_OAUTH_GITHUB_CLIENTID = 'ghtest2'
    process.env.AUTH_OAUTH_GITHUB_CLIENTSECRET = 'ghtest2-secret'
    process.env.AUTH_OAUTH_GITHUB_USERAGENT = 'ghtest2-ua'
    process.env.COMM_SENDERS_ERR_EMAIL = 'err@test.com'
    process.env.MODEL_MONGOURL = 'mongo://ghtest2/db'
    process.env.MODEL_SESSIONSTORE_COLLECTION = 'sessions-test2'
    var cfg2 = Configure({}, 'dev')
    expect(cfg2.env).to.equal('dev')
    expect(cfg2.auth.loginUrl).to.equal('/')
    expect(cfg2.auth.appKey).to.equal('test2')
    expect(cfg2.auth.oauth.github.short).to.equal('gh')
    expect(cfg2.auth.oauth.github.login).to.equal(true)
    expect(cfg2.auth.oauth.github.signup).to.equal(true)
    expect(cfg2.auth.oauth.github.emails).to.equal(true)
    expect(cfg2.auth.oauth.github.logic).to.equal('oauth')
    expect(cfg2.auth.oauth.github.clientID).to.equal('ghtest2')
    expect(cfg2.auth.oauth.github.clientSecret).to.equal('ghtest2-secret')
    expect(cfg2.auth.oauth.github.userAgent).to.equal('ghtest2-ua')
    expect(cfg2.auth.oauth.github.callbackURL).to.equal('http://localhost:3333/auth/github/callback')
    expect(cfg2.auth.oauth.github.scope.length).to.equal(1)
    expect(cfg2.auth.oauth.github.scope[0]).to.equal('user')
    expect(cfg2.http.port).to.equal(3333)
    expect(cfg2.http.host).to.equal('http://localhost:3333')
    EXPECT.contains(cfg2.http.static.dirs[0], 'web/public')
    expect(cfg2.model.mongoUrl).to.equal('mongo://ghtest2/db')
    expect(cfg2.model.sessionStore.collection).to.equal('sessions-test2')
    DONE()
  })


  IT('{{undefine}} auth and comm sections from appConfig', function() {
    var appCfg3 = { auth: undefined, http: {}, comm: "{{undefine}}" }
    process.env.MODEL_MONGOURL = 'mongo://ghtest3/db'
    process.env.MODEL_SESSIONSTORE_COLLECTION = 'sessions-test3'

    var cfg3 = Configure(appCfg3, 'dev')
    expect(cfg3.auth).to.be.undefined
    expect(cfg3.http.host).to.equal('http://localhost:3333')
    expect(cfg3.model.mongoUrl).to.equal('mongo://ghtest3/db')
    expect(cfg3.model.sessionStore.collection).to.equal('sessions-test3')
    DONE()
  })


  IT('{{undefine}} log.auth section from env var', function() {
    var appCfg4 = { auth: "{{undefine}}", model: undefined, comm: undefined }
    process.env.LOG_AUTH = '{{undefine}}'

    var cfg4 = Configure(appCfg4, 'dev')
    expect(cfg4.auth).to.be.undefined
    expect(cfg4.model).to.be.undefined
    expect(cfg4.log).to.exist
    expect(cfg4.log.auth).to.be.undefined
    DONE()
  })


  IT('Configure works ok with cfg.init logging on', function() {
    var appCfg5 = { auth: undefined, comm: undefined }
    process.env.LOG_CFG_INIT = 'white'
    process.env.MODEL_MONGOURL = 'mongo://ghtest0/db'
    process.env.MODEL_SESSIONSTORE_COLLECTION = 'sessions-test0'
    var cfg0 = Configure(appCfg5, 'dev')
    DONE()
  })


  IT('Merges appConfig values on top of defaults', function() {
    var appCfg7 = { log: { app: false }, model: undefined, auth: undefined, comm: undefined }
    var cfg7 = Configure(appCfg7, 'dev')
    expect(cfg7.log.app).to.equal(false)
    DONE()
  })


  IT('Merges appConfig values and sub-section on top of defaults', function() {
    var appCfg6 = { auth: { oauth: { github: { signup: false } } }, comm: undefined, model: undefined, wrappers: { timezone: { key: 'testtime' } } }
    process.env.AUTH_APPKEY = 'test6'
    process.env.AUTH_OAUTH_GITHUB_CLIENTID = 'ghtest6'
    process.env.AUTH_OAUTH_GITHUB_CLIENTSECRET = 'ghtest6-secret'
    process.env.AUTH_OAUTH_GITHUB_USERAGENT = 'ghtest6-ua'
    process.env.PORT = "4444"

    var cfg4 = Configure(appCfg6, 'dev')
    expect(cfg4.auth.oauth.github.short).to.equal('gh')
    expect(cfg4.auth.oauth.github.login).to.equal(true)
    expect(cfg4.auth.oauth.github.signup).to.equal(false)
    expect(cfg4.auth.oauth.github.emails).to.equal(true)
    expect(cfg4.auth.oauth.github.clientID).to.equal('ghtest6')
    expect(cfg4.auth.oauth.github.clientSecret).to.equal('ghtest6-secret')
    expect(cfg4.auth.oauth.github.userAgent).to.equal('ghtest6-ua')
    expect(cfg4.auth.oauth.github.callbackURL).to.equal('http://localhost:4444/auth/github/callback')
    expect(cfg4.auth.oauth.github.scope.length).to.equal(1)
    expect(cfg4.auth.oauth.github.scope[0]).to.equal('user')
    expect(cfg4.wrappers.timezone.key).to.equal('testtime')
    DONE()
  })


  IT('Add nested appConfig sub-section where no defaults exist', function() {
    var appCfg8 = { log: { test8: { theme: { run: 'white', error: 'red' } } }, auth: undefined, comm: undefined, model: undefined }
    var cfg8 = Configure(appCfg8, 'dev')
    expect(cfg8.log.test8.theme.run).to.equal('white')
    expect(cfg8.log.test8.theme.error).to.equal('red')
    DONE()
  })


  IT('Add nested appConfig false value where no defaults exist', function() {
    var appCfg9 = { auth: { appKey: 'tt', oauth: { github: { unlink: false, relink: true, clientID: 'test', clientSecret: 'test', userAgent: 'tt9' } } }, comm: undefined, model: undefined }
    var cfg9 = Configure(appCfg9, 'dev')
    expect(cfg9.auth.oauth.github.relink).to.equal(true)
    expect(cfg9.auth.oauth.github.unlink).to.equal(false)
    DONE()
  })


  IT('Applies env var value on top of appConfig base and {{required}} values', function() {
    var appCfg11 = {
      log: { test11: { theme: { run: 'blue', error: 'magentra' } } },
      wrappers: { timezone: { key: '{{required}}' }},
      auth: undefined, comm: undefined, model: undefined
    }
    process.env.LOG_TEST11_THEME_RUN = 'gray'
    process.env.LOG_TEST11_THEME_ERROR = 'white'
    process.env.WRAPPERS_TIMEZONE_KEY = 'whitetime'
    var cfg11 = Configure(appCfg11, 'dev')
    expect(cfg11.wrappers.timezone.key).to.equal('whitetime')
    expect(cfg11.log.test11.theme.run).to.equal('gray')
    expect(cfg11.log.test11.theme.error).to.equal('white')
    DONE()
  })


  SKIP('Env vars without defaults or appConfig placeholders disappear', function() { })


  IT('Dev mode gets default host without http.host env input', function() {
    var appCfg12 = { auth: undefined, comm: undefined, model: undefined }
    var cfg12 = Configure(appCfg12, 'dev')
    expect(cfg12.http.host).to.equal('http://localhost:3333')
    DONE()
  })


  IT('Test mode throws error without http.host env input', function() {
    var fn = () => Configure({ auth: undefined, comm: undefined, model: undefined }, 'test')
    expect(fn).to.throw(Error, /Configure failed. Override or environment var required for config.HTTP_HOST/)
    DONE()
  })


  IT('Applies distribution bundle values when environment dist.manifest set', function() {
    var appCfg14 = require('../fixtures/app14.json')
    appCfg14.appDir = join(__dirname, '../')

    var cfg14a = Configure(appCfg14, 'dev')
    expect(cfg14a.http.static.bundles["js/ang1.js"]).to.equal("js/ang1.js")
    expect(cfg14a.http.static.bundles["css/app.css"]).to.equal("css/app.css")

    process.env.HTTP_STATIC_MANIFEST = 'fixtures/app14.rev.json'
    var cfg14b = Configure(appCfg14, 'dev')
    expect(cfg14b.http.static.bundles["js/ang1.js"]).to.equal("js/ang1-14a26f2a4e.js")
    expect(cfg14b.http.static.bundles["css/app.css"]).to.equal("css/app-0d80f1fb17.css")

    DONE()
  })


})
