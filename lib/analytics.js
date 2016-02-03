'use strict';


var Doc = (DAL, {map, toUserId, noop}) =>
  function(type, {user,sessionID}, ctx, data, cb) {
    var d = user ? { uId: toUserId(user._id) } : { sId: sessionID }
    if (data) Object.assign(d, data)
    if (ctx) {
      if (ctx.ip) d.ip = ctx.ip
      if (ctx.app) d.app = ctx.app
      if (ctx.ua) d.ua = ctx.ua
      if (ctx.utm) d.utm = ctx.utm
      if (ctx.ref) d.ref = ctx.ref
    }
    DAL[map[type]].create(d, noop)
    $logIt(`trk.${type}`, `${type}>${d.name||d.type}`,
      JSON.stringify(_.omit(d,'name'))
        .replace(/^\{/,'').replace(/\}$/,'').replace(/\"([^(\")"]+)\":/g,"$1:".dim).gray)
    cb = cb||noop
    cb(null, d) // unblocked
  }

var aliasDocs = (DA, sId, uId, cb) =>
  !DA ? 0 : DA.getManyByQuery({sId}, {select:'_id'}, (e, updates) =>
    DA.updateSetBulk(updates.map( up => Object.assign(up,{uId}), cb)))


class Analytics {

  constructor(config, DAL, opts) {
    opts = opts || {}
    opts.noop = opts.noop || (e=>{})
    opts.toUserId = opts.toUserId || (id => DAL.User.toId(id))
    opts.map = config.model.analytics.collections

    this.tracking = opts.tracking


    var createDoc = Doc(DAL, opts)
    var {event,impression,issue,view} = opts.map
    var Ctx = (ctx) => Object.assign({ app: config.analytics.appKey }, ctx)


    if (impression) this.impression = function(ad, cb) {
      createDoc('impression', this, Ctx(this), {img:ad.img}, cb)
    }

    if (issue) this.issue = function(name, type, data, cb) {
      createDoc('issue', this, Ctx({}), {name,type,data,ctx:this.ctx}, cb)
    }

    // Expects authenticated / identified users only
    if (event) this.event = function(name, data, cb) {
      createDoc('event', this, Ctx({}), {name,data}, cb)
    }

    if (event) this.alias = function(user, sessionID, eventName, data, cb) {
      createDoc('event', this, Ctx({}), {name:eventName,data}, cb)
      aliasDocs(DAL[view], sessionID, toUserId(user._id), noop)
      aliasDocs(DAL[issue], sessionID, toUserId(user._id), noop)
    }

    if (view) this.view = function(type, obj, cb) {
      createDoc('view', DAL, this, Ctx(this), { oId: obj._id, url: this.path, type }, cb)
    }
  }

}


module.exports = (config, DAL, opts) => new Analytics(config, DAL, opts)
