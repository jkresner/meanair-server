var COMM;


module.exports = () => DESCRIBE("SEND", function() {


  DESCRIBE("MAIL",  function() {


    before(function(){
      global.$logIt = () => {}
      global.Wrappers = {}
      global.cache = {
        templates: {
          welcome: {
            sender:   'pairbot',
            mail:     { subject: 'Hello', markdown: 'Yo {{firstName}}, confirm at test.com/{{id}}' }
          }
        }
      }
      var config = {
        comm: {
          mode: 'stub',
          dispatch: {
            transports: ['ses','smtp'],
            groups:     { errors: "jk <jk@air.test>,abc <sbc@test.com>" }
          },
          senders: {
            err: { name: 'ERR', app: 'APPKEY', email: 'team@test.com' },
            sys: { name: 'Pairbot', email: 'pairbot@test.com' }
          }
        },
        wrappers: {
          smtp: {},
          ses: {}
        }
      }
      COMM = require('../../lib/comm')(config)
    })


    IT('Send raw markdown message over smtp from one user to another user', function() {
      var sender = { name: 'Customer Service', email: 'cs@test.air', slack: { token: 'sadfasdf' } }
      var to = { name: 'Jonny 5', email: 'j5@air.test', slack: { id: 'T06111115' } }
      COMM('smtp').from('sys').raw({markdown:'hello *buddy*', subject:`[${to.name}] Good to see you`}).send(to, (e,r) => {
        expect(r.from).to.equal('Pairbot <pairbot@test.com>')
        expect(r.to[0]).to.equal('Jonny 5 <j5@air.test>')
        expect(r.markdown).to.equal('hello *buddy*')
        expect(r.subject).to.equal('[Jonny 5] Good to see you')
        expect(r.html).to.equal('<p>hello <em>buddy</em></p>\n')
        expect(r.text).to.equal('hello *buddy*')
        DONE()
      })
    })


    IT('Send raw text message over smtp from comm.sender to a user', function() {
      var sender = 'sys'
      var to = { name: 'Jonny 6', email: 'j6@air.test' }
      COMM('ses').from('sys').raw({text:'hello bud',subject:`Good to welcome you`}).send(to, (e,r) => {
        expect(r.to[0]).to.equal('Jonny 6 <j6@air.test>')
        expect(r.subject).to.equal('Good to welcome you')
        expect(r.markdown).to.be.undefined
        expect(r.html).to.be.undefined
        expect(r.text).to.equal('hello bud')
        DONE()
      })
    })


    IT('Send mass error mail to adm group', function() {
      var e = Error("Try this one on for size")
      COMM('ses').error(e, {subject:`{APPKEY} ${e.message}`}, (e,r) => {
        expect(r.from).to.equal('ERR <team@test.com>')
        expect(r.to[0]).to.equal('jk <jk@air.test>')
        expect(r.to[1]).to.equal('abc <sbc@test.com>')
        expect(r.subject).to.equal('{APPKEY} Try this one on for size')
        DONE()
      })
    })


    IT('Send template to many users with smtp', function() {
      var many = [
        { name: 'Jonny 50', email: 'j50@air.test', slack: { id: 'T06500115' }},
        { name: 'Jay 60', email: 'jay60@air.test', slack: { id: 'T06600115' }}
      ]
      var data = { id: '123455' }
      // // automatch notification
      COMM('smtp').from('sys').tmpl('welcome', data).send(many, (e,r) => {
        expect(r.length).to.equal(many.length)
        EXPECT.contains(r[0].markdown, "Yo Jonny")
        EXPECT.contains(r[0].markdown, "test.com/123455")
        EXPECT.contains(r[1].markdown, "Yo Jay")
        EXPECT.contains(r[1].markdown, "test.com/123455")
        DONE()
      })
    })

  })

})
