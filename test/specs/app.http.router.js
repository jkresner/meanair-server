var App = require('../../lib/app.init')
var notFound = (res, req, next) => next(null, console.log('not found'.magenta))



module.exports = () => DESCRIBE("Router", function() {


  beforeEach(function() {
    global.assign = Object.assign
    global.$load = function() {}
    global.$logIt = function() {} //console.log
  })


  IT('Router does not spill used middleware', function() {
    var cfg = {http:{port:10}, middleware: { dirs: ['mw'] }, routes: { dirs: ['sr'] }, templates:{dirs:{}}}
    var count = 0
    var plumber = {}
    plumber = {
      $requireDir(dir, {dependencies}) {
        var [app, MW, cfg] = dependencies
        if (++count == 1) {
          var mwN = (n) => function(req,res,next) {
            // console.log('mw'+n);`
            req.locals.order = req.locals.order || []
            req.locals.order.push('mw'+n)
            next(null, req.locals['mw'+n] = true)
          }
          MW.cache('mw1', mwN(1))
          MW.cache('mw2', mwN(2))
          MW.cache('mw3', mwN(3))
          MW.cache('notFound', notFound)
          MW.cache('error', (e, req, res, next) => { throw(e) })
        } else {
          app.use((req,res,next) => {
            // console.log('global.use:', req.originalUrl)
            req.locals = {}
            global.COOKIE = 'spill'
            next()
          })

          app.honey.Router('r0')
            .get('/', (req, res, next) => { res.send('home'); })
            .get('/about', (req, res, next) => { res.send('about'); })


          app.honey.Router('/r1')
           .use(MW.$['mw1']) //mw3'))
           // .use(MW.$$('mw1 mw3'))
           .use(MW.$['mw3'])
           .get('/r1', function(req, res) {
            // console.log('in /r1'.yellow, req.locals)
            expect(req.locals.mw1).to.equal(true)
            expect(req.locals.mw2).to.be.undefined
            expect(req.locals.mw3).to.equal(true)
            expect(req.locals.order[0]).to.equal('mw1')
            expect(req.locals.order[1]).to.equal('mw3')
            res.send('ok1')
          })

          app.honey.Router('m2').use(MW.$.mw2)
            .get('/r2', (req, res) => {
            // console.log('in /r2'.yellow, req.locals)
            expect(req.locals.mw1).to.be.undefined
            expect(req.locals.mw2).to.equal(true)
            expect(req.locals.mw3).to.be.undefined
            res.send('ok2')
          })
        }
      }
    }

    var ready = function(e) {
      PAGE('/r1', {}, (content1) => {
        expect(content1).to.equal('ok1')
        PAGE('/r2', {}, (conten2) => {
          expect(conten2).to.equal('ok2')
          DONE()
        })
      })
    }

    global.APP = App.call({plumber}, cfg, ready)
    APP.meanair.chain({},{}).run()
  })



})
