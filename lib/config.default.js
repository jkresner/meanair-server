var noDefault = '{{required}}'
var c='cyan',g='gray',w='white',m='magenta',r='red',b='blue',y='yellow',s='green',n=null


var defaults = {
  auth: {
    loginUrl:               '/',
    loggedinUrl:            '/',
    appKey:                 noDefault,
    oauth: {
      github: {
        short:              'gh',
        signup:             true,
        login:              true,
        logic:              'link',
        clientID:           noDefault,
        clientSecret:       noDefault,
        scope:              ['user'],
        emails:             true,
        userAgent:          noDefault,
      }
    },
    orgs:                   false
  },
  log: {
    app:                    { theme: {app:b,lapse:w,sublapse:g,wire:c,require:n} },
    api:                    { theme: {trace:n} },
    auth:                   { theme: {link:s,create:s,login:s} },
    conf:                   { theme: {load:n,routes:y} },
    debug:                  { theme: {log:m} },
    model:                  { theme: {load:b,connect:b,read:c,write:y} },
    error:                  true,
    mw:                     { theme: {trace:c,init:n,page:n,notFound:r,error:r} },
    res:                    { theme: {page:c,notFound:m,slow:m,error:r,unauthorized:m} },
    test:                   false,
    wrappers:               { theme: {init:b} }
  },
  http: {
    cookieSecret:           'mirco-consulting',
    port:                   3333,
    host:                   noDefault,
    static: {
      dir:                  'public',
      maxAge:               null,
      bundle:               { appCss: '/css/app.css', appJs: '/js/app.js' }
    },
    security: {
      bots: {
        allow: /googlebot/i,
        disallow: /uk_lddc_bot|MJ12bot/i,
      }
    }
  },
  middleware: {
    api:                  { baseUrl: '/api' },
    plugins:              ['res.slow'],
    session: {
      authedData:         '_id name scope',
      saveUninitialized:  true, // saved new sessions
      resave:             false, // skip automatica re-write to the session store
      name:               'mirco-consult',
      cookie:             { httpOnly: true, maxAge: 9000000 },  // don't forget to set prod maxAge
      wrapper:            null
    }
  },
  model: {
    mongoUrl:               noDefault,
    sessionStore: {
      autoReconnect:        true,
      collection:           noDefault
    }
  },
  views:                    { engine: 'hbs' },
  logic:                    {},
  routes:                   {},
  wrappers:                 false
}


module.exports = defaults

