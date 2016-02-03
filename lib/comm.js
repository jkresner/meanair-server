'use strict';

class Dispatch {

  constructor(config) {

    var cfg = config.comm
    for (var t of cfg.dispatch.transports)
      this[t] = Wrappers[t]

    this.senders = {}
    for (var s in cfg.senders)
      this.senders[s] = cfg.senders[s]

    // create functions from config next iteration
    this.error = (e, data, done) => {
      var subject = data.subject || `{${cfg.senders['err'].app}} ${e.message}`
      var text = data.text || (e.toString() + e.stack.toString())
      var sender = cfg.senders['err']
      this['ses'].sendGroup('errors', {text,subject}, {sender}, done)
    }

  }

  resolveFrom(sender, transports) {
    var s = null
    if (sender.constructor != String)
      s = sender
    else {
      if (!this.senders[sender]) throw Error(`Sender ${sender} not defined in config`)
      s = this.senders[sender]
    }
    //-- TODO check sender has details for transports
    return s
  }

  toUser(user, msg, opts, done) {
    for (var transport of opts.transports)
      this[transport].sendUser(user, msg, opts, done)
  }

  //-- Assume all templates and groups are available in cache
  toGroup(group, msg, opts, done) {
    for (var transport of opts.transports)
      this[transport].sendGroup(group, msg, opts, done)
  }

}


function msgBuilder(transport) {

  //-- Next iteration to support multiple transports at at time
  var opts = { transports: [transport] }

  //-- Should only pass done for single user 'to'
  function send(to, done) {
    if (to.constructor !== Array) to = [to]

    var sent = []
    var cb = !done ? null : ((e,r) => {
      sent.push(e||r)
      if (sent.length == to.length)
        done(null, to.length == 1 ? sent[0] : sent)
    })

    for (var user of to) {
      var msg = opts.raw ||
                Composer.render(Object.assign({to:user},opts))
      dispatch.toUser(user, msg, opts, cb)
    }
  }

  function sendGroup(group, done) {
    if (!opts.raw) throw Error("Only raw messages for groups atm")
    dispatch.toGroup(group, opts.raw, opts, done)
  }

  function raw(raw) {
    opts.raw = raw
    return {send,sendGroup}
  }

  function tmpl(name, data) {
    opts.template = Composer.getCompiledTemplate(transport, name)
    opts.data = data
    return {send,sendGroup}
  }

  return {
    error: dispatch.error,
    from(sender) {
      opts.sender = dispatch.resolveFrom(sender, [transport])
      return {raw,tmpl}
    }
  }

}


var dispatch;
module.exports = function(config) {
  require('./comm.transports').init(config)
  dispatch = new Dispatch(config)

  return msgBuilder
}
