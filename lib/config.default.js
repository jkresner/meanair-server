var noDefault = '{{required}}'
var c='cyan',g='gray',w='white',m='magenta',r='red',b='blue',y='yellow',s='green',n=null


var defaults = {
  auth: {
    loginUrl:                '/',
    loggedinUrl:             '/',
    appKey:                  noDefault,
    oauth: {
      github: {
        short:               'gh',
        signup:              true,
        login:               true,
        logic:               'link',
        clientID:            noDefault,
        clientSecret:        noDefault,
        scope:               ['user'],
        emails:              true,
        userAgent:           noDefault,
      }
    },
    orgs:                    false
  },
  log: {
    app:                     { theme: {app:b,lapse:w,sublapse:g,wire:n,require:n} },
    auth:                    { theme: {link:s,create:s,login:s} },
    conf:                    { theme: {load:n,routes:y} },
    debug:                   { theme: {log:m} },
    model:                   { theme: {load:n,connect:s,read:c,write:y,cache:w} },
    error:                   true,
    mw:                      { theme: {trace:c,init:n,page:n,notFound:r,error:r,api:g} },
    res:                     { theme: {page:c,notFound:m,slow:m,error:r,unauthorized:m} },
    test:                    false,
    wrappers:                { theme: {init:b} }
  },
  http: {
    cookieSecret:            'mirco-consulting',
    host:                    noDefault,
    port:                    3333,
    security: {
      bots: {
        allow: /googlebot/i,
        disallow: /uk_lddc_bot|MJ12bot/i,
      }
    },
    static: {
      bundle:                {},
      dirs:                  'public',
      maxAge:                null
    }
  },
  middleware: {
    api:                     { baseUrl: '/api' },
    plugins:                 ['res.slow'],
    session: {
      authedData:            '_id name scope',
      saveUninitialized:     true, // saved new sessions
      resave:                false, // skip automatica re-write to the session store
      name:                  'mirco-consult',
      cookie:                { httpOnly: true, maxAge: 9000000 },  // don't forget to set prod maxAge
      wrapper:               null
    }
  },
  model: {
    mongoUrl:                noDefault,
    sessionStore: {
      autoReconnect:         true,
      collection:            noDefault
    },
    cache:                   undefined,
  },
  views:                     { engine: 'hbs' },
  logic:                     {},
  routes:                    {},
  wrappers:                  undefined
}


module.exports = defaults

