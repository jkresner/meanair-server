var {createTransport}    = require('nodemailer')
var {markdown}           = require('nodemailer-markdown')
var address = ({name,email}) => `${name} <${email}>`


var smtpWrapper = {

  name: 'smtp',
  noop:  e => e ? $log('smtp.error'.red, e) : 0,

  init(config) {
    var {comm}               = config

    if (comm.mode == 'stub')
      this.api = createTransport(require('nodemailer-stub-transport')())
    else
      this.api = createTransport(config.wrappers.smtp)

    this.api.use('compile', markdown())
  },

  _send(mail, opts, cb)
  {
    cb = cb || noop
    mail.from = address(opts.sender)
    this.api.sendMail(mail, (e, info) => {
      $logIt('comm.send', 'smtp.from', mail.from.white, mail.subject)
      $logIt('comm.mail', 'mail.to', mail.to.join(',').white, '\n'+mail.text)
      cb(e, mail)
    })
  },

  sendUser(user, mail, opts, cb) {
    mail.to = [address(user)]
    this._send(mail,opts,cb)
  },

  sendGroup(group, mail, opts, cb) {
    throw Error("Haven't implemented smtp groups propertly yet")
  }
}


var sesWrapper = {

  name:  'ses',
  noop:  e => e ? $log('ses.error'.red, e) : 0,

  init(config) {
    var {comm}               = config
    this.groups              = comm.dispatch.groups

    if (comm.mode == 'stub')
      this.api = createTransport(require('nodemailer-stub-transport')())
    else {
      var sesTransport       = require('nodemailer-ses-transport')
      this.api = createTransport(sesTransport(config.wrappers.ses))
    }

    this.api.use('compile', markdown())
  },

  _send(mail, opts, cb)
  {
    cb = cb || this.noop
    mail.from = address(opts.sender)
    this.api.sendMail(mail, (e, info) => {
      $logIt('comm.send', 'ses.from', mail.from.white, mail.subject)
      $logIt('comm.mail', 'mail.to', mail.to.join(',').white, '\n'+mail.text)
      cb(e, mail)
    })
  },

  sendUser(user, mail, opts, cb) {
    mail.to = [address(user)]
    this._send(mail,opts,cb)
  },

  sendGroup(group, mail, opts, cb) {
    if (group != 'errors')
      throw "SES haven't implemented groups propertly yet"
    mail.to = this.groups.errors.split(',')
    this._send(mail,opts,cb)
  }

}


module.exports = {

  init: function(config) {
    global.Wrappers = global.Wrappers || {}
    if (config.wrappers.smtp) {
      Wrappers.smtp = smtpWrapper
      Wrappers.smtp.init(config)
    }
    if (config.wrappers.ses) {
      Wrappers.ses = sesWrapper
      Wrappers.ses.init(config)
    }
  }

}
