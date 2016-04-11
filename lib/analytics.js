'use strict';

//-- todo: move this whole thing into a seperate merge app like auth


function $formatter(type, d, {user,sId,ip,ref}) {
  if (!config.log || !config.log.trk[type]) return
  var ident = user != null ? `${user.name||user._id}`.gray : `${sId.substring(0,12)}`.cyan

  var jdata = type == 'view'
    ? `${(d.url||'').cyan} ${ref?ref.replace(/https\:\/\/|http\:\/\//g,'<<< ').replace('www.','').blue:''}`
    : JSON.stringify(d.data||{}).replace(/^\{/,'').replace(/\}$/,'').replace(/\"([^(\")"]+)\":/g,"$1:".dim).gray
  var label = type
  if (type == 'event') label = d.name
  if (type == 'view') label = `VIEW:${d.type}`
  $logIt(`trk.${type}`
    , label.toUpperCase()
    , `${ip.replace(':ffff','')}`.cyan+`\t${ident}`
    , jdata
  )
}


var Doc = (DAL, {app, map, toUserId, formatter, noop}) =>
  function(type, ctx, d, cb) {
    d.app = app
    d.ip = ctx.ip
    d.sId = ctx.sId // sessionID
    if (ctx.user) d.uId = toUserId(ctx.user._id)
    if (ctx.ua) d.ua = ctx.ua
    if (ctx.utm) d.utm = ctx.utm
    if (ctx.ref) d.ref = ctx.ref

    DAL[map[type]].create(d, noop)
    formatter(type, d, ctx)
    cb = cb||noop
    cb(null, d) // unblocked
  }


var aliasDocs = (DA, sId, uId, cb) =>
  !DA ? 0 : DA.getManyByQuery({sId,uId:{$exists:0}}, {select:'_id'}, (e, updates) =>
    DA.updateSetBulk(updates.map(up => assign(up,{uId}), cb)))


class Analytics {

  constructor(config, DAL, opts) {
    opts = opts || {}
    opts.noop = opts.noop || (e=>{})
    opts.toUserId = opts.toUserId || (id => DAL.User.toId(id))
    opts.map = config.model.analytics.collections
    opts.formatter = opts.formatter || $formatter
    opts.app = config.analytics.appKey

    var createDoc = Doc(DAL, opts)

    var {event,impression,issue,view} = opts.map

    var tracking = opts.tracking || {}
    this.tracking = tracking  // hmmmmmm a bit messy

    var project = (name, data) => {
      var key = name.split(':')[0]
      return assign({name},{data:tracking[key]?tracking[key](data):data})
    }

    var Ctx = (ctx) => ctx.ctx || ctx // can be lazy / pass req or this

    if (event) this.event = function(ctx, name, data, cb) {
      var alias = ctx.analytics.alias
      var ctx = Ctx(ctx)

      if (alias) {
        ctx.user = alias
        var uId = opts.toUserId(ctx.user._id)
        aliasDocs(DAL[view], ctx.sId, uId, opts.noop)
        aliasDocs(DAL[issue], ctx.sId, uId, opts.noop)
        aliasDocs(DAL[impression], ctx.sId, uId, opts.noop)
      }

      createDoc('event', ctx, project(name, data), cb)
    }

    if (impression) this.impression = function(ctx, ad, cb) {
      createDoc('impression', Ctx(ctx), {img:ad.img,_id:ad._id}, cb)
    }

    if (issue) this.issue = function(ctx, name, type, data, cb) {
      createDoc('issue', Ctx(ctx), {name,type,data,ctx:this.ctx}, cb)
    }

    if (view) this.view = function(ctx, type, obj, cb) {
      createDoc('view', Ctx(ctx), { oId: obj._id, url: obj.url, type }, cb)
    }
  }

}


module.exports = (config, DAL, opts) => new Analytics(config, DAL, opts)
