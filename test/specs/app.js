var MA = require('../../lib/index')
var overrides = (name) =>
  JSON.parse(JSON.stringify(require(`../fixtures/${name}.json`)))


module.exports = () => DESCRIBE("Index", function() {


  beforeEach(function() {
    // process.env.LOG_CFG_INIT = "white"
    if (global.config) delete global.config
  })


  IT('No model or auth config + missing done callback', function() {
    var cfg1 = MA.Setup(overrides('app1'), "dev").config
    function run() {
      var app = MA.App.init(cfg1)
      app.meanair.set({})
                 .use(cfg1.middleware)
                 .run()
      return app
    }

    var app1 = run()
    expect(app1).to.exist
    expect(app1.meanair).to.exist
    DONE()
  })


  IT('model + safePersist session wrapper', function() {
    var overrides2 = overrides('app2')
    overrides2.appDir = __dirname.replace('specs', 'app2')
    var cfg2 = MA.Setup(overrides2, "dev").config

    function run() {
      var app = MA.App.init(cfg2)
      var model = { DAL: { Users: {} } }
      app.meanair.set(model, {logicDir:cfg2.logic.dirs[0]})
                 .use(cfg2.middleware)
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
