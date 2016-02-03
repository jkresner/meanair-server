var crypto = require('crypto')
var marked = require('marked')

function Markdown(options, renderer) {
  this._options = {};
  this._renderer = renderer;
  this._imageCount = 0;

  // create a shallow copy of the passed options
  Object.keys(options || {}).forEach(function(key) {
      this._options[key] = options[key];
  }.bind(this));

  if (options.useEmbeddedImages) {
      this._updateRenderer();
  }
}
Markdown.prototype.process = function(mail, callback) {
    if (!mail || !mail.data || !mail.data.markdown || mail.data.html) {
        return callback();
    }

    this._mail = mail || {};

    mail.resolveContent(mail.data, 'markdown', function(err, markdown) {
        if (err) {
            return callback(err);
        }

        markdown = (markdown || '').toString();
        marked(markdown, this._options, function(err, html) {
            if (err) {
                return callback(err);
            }

            mail.data.html = html;

            if (!mail.data.text) {
                mail.data.text = markdown;
            }

            callback(null);
        }.bind(this));
    }.bind(this));
};
Markdown.prototype._updateRenderer = function() {
  var imageRenderer = this._renderer.image;
  this._renderer.image = function(href, title, text) {
    return imageRenderer.call(this._renderer, 'cid:' + this._createImage(href).cid, title, text);
  }.bind(this);
  this._options.renderer = this._renderer;
};
Markdown.prototype._createImage = function(href) {
  var cid = (this._options.cidBase || crypto.randomBytes(8).toString('hex')) + '-' + (++this._imageCount) + '@localhost';
  var image = { path: href, cid: cid };

  if (!this._mail.data.attachments)
    this._mail.data.attachments = [image]
  else
    this._mail.data.attachments.push(image);

  return image;
};

var markdown = () => function(mail, callback) {
  var handler = new Markdown({}, new marked.Renderer());
  handler.process(mail, callback);
}

var {createTransport}    = require('nodemailer')
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
      if (!mail.from.match('ERR')) {
        $logIt('comm.send', 'smtp.from', mail.from.white, mail.subject)
        $logIt('comm.mail', 'mail.to', mail.to.join(',').white, '\n'+mail.text)
      }
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
