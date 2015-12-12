const noDefault = '{{required}}'
const c='cyan',g='gray',w='white',m='magenta',r='red',b='blue',y='yellow',s='green',n=null,u='{{undefine}}'


var defaults = {
  about:                     undefined,   // set path to package.json
  auth: {
    appKey:                  noDefault,
    loginUrl:                '/',
    loggedinUrl:             '/',
    oauth: {
      github: {
        short:               'gh',
        signup:              true,
        login:               true,
        logic:               'oauth',
        clientID:            noDefault,
        clientSecret:        noDefault,
        scope:               ['user'],
        emails:              true,
        userAgent:           noDefault,
      }
    },
    orgs:                    false
  },
  http: {
    cookieSecret:            'mirco-consulting',
    host:                    noDefault,
    port:                    3333,
    security: {
      bots: {
        allow:               /googlebot/i,
        disallow:            /uk_lddc_bot|MJ12bot/i,
      }
    },
    static: {
      bundles:               {},
      dirs:                  'public',
      manifest:              null,
      maxAge:                null
    }
  },
  log: {
    app:                     {init:b,verbose:n,lapse:w,sublapse:g,wire:n,require:n,debug:m,error:r,test:n},
    auth:                    {link:s,create:s,login:s},
    cfg:                     {init:n,route:y},
    modl:                    {init:n,connect:s,read:n,write:n,cache:w},
    mw:                      {init:n,trace:c,api:g,valid:m,page:u,notFound:r,error:r,forbid:m,authRedirect:u,oauth:u,logout:u,cached:u,param:u,recast:u,project:u,domainWrap:u,slow:u,jsonLimit:u,page:u,empty:u,logic:u},
    pay:                     {in:g,out:g,method:y},
    wrpr:                    {init:b,call:n,apicall:n},
  },
  logic:                     {},
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
  routes: {
    redirects:               { on: false },
    dynamic:                 { on: false },
    whiteList:               { on: false }
  },
  views:                     { engine: 'hbs' },
  wrappers:                  undefined
}


module.exports = () => {
  defaults.http.port = process.env.PORT || 3333
  return JSON.parse(JSON.stringify(defaults))
}

