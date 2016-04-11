var MA = require('../../lib/index')


module.exports = () => SKIP("Index", function() {


  beforeEach(function() {
    process.env.LOG_CFG_INIT = "white"
    if (global.config) delete global.config
  })


  IT('No model or auth config + missing done callback', function() {
    var cfgDir = __dirname.replace('specs', 'fixtures/app01')

    var cfg1 = MA.Config(cfgDir, "dev", false)
    function run() {
      var app = MA.App(config)
      app.meanair.set({})
                 .chain(cfg1.middleware)
                 .run()
      return app
    }

    var app1 = run()
    expect(app1).to.exist
    expect(app1.meanair).to.exist
    DONE()
  })


  IT('model + safePersist session wrapper', function() {
    var cfgDir = __dirname.replace('specs', 'app2/server')
    var cfg2 = MA.Config(cfgDir, "dev")

    function run() {
      var app = MA.App(cfg2)
      var model = { DAL: { Users: {} }, sessionStore: function() {} }
      app.meanair.lib({passport:require('passport')})
                 .set(model, {logicDir:cfg2.logic.dirs[0]})
                 .chain(cfg2.middleware)
                 .run()
      return app
    }

    var app2 = run()
    expect(app2).to.exist
    expect(app2.meanair).to.exist
    expect(app2.meanair.middleware).to.exist
    DONE()
  })


})
