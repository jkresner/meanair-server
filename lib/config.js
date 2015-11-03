var noDefault = '{{required}}'
var c='cyan',g='gray',w='white',m='magenta',r='red',b='blue',y='yellow',n=null


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
        clientID:           noDefault,
        clientSecret:       noDefault,
        scope:              ['user'],
        emails:             true,
        userAgent:          noDefault,
      }
    }
  },
  log: {
    // set any of these to false to turn logging off
    app:                    { theme: {app:b,lapse:w,sublapse:g,config:n} },
    api:                    false,
    auth:                   true,
    conf:                   { theme: {load:n,routes:n} },
    dal:                    false,
    error:                  true,
    mw:                     { theme: {name:c,session:g,data:g,auth:y} },
    res:                    { theme: {page:c,notFound:m,slow:m,error:r,unauthorized:m} },
    test:                   false
  },
  http: {
    port:                   3333,
    host:                   noDefault,
    session: {
      authedData:           '_id name scope',
      saveUninitialized:    true, // saved new sessions
      resave:               false, // skip automatica re-write to the session store
      name:                 'mirco-consult',
      secret:               'mirco-consulting',
      cookie:               { httpOnly: true, maxAge: 9000000 }  // don't forget to set prod maxAge
    },
    sessionStore: {
      autoReconnect:        true,
      collection:           noDefault
    },
    static: {
      dir:                  'web/public',
      maxAge:               null,
      bundle: {
        appCss:             '/css/app.css',
        appJs:              '/js/app.js'
      }
    }
  },
  mongoUrl:                 noDefault
}


module.exports = defaults
