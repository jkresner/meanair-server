const noDefault = '{{required}}'
const c='cyan',g='gray',w='white',m='magenta',r='red',b='blue',y='yellow',s='green',n=null,u='{{undefine}}'


var defaults = {
  about:                     undefined,   // set path to package.json
  analytics: {
    appKey:                  undefined
  },
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
    orgs:                    false,
    password:                undefined,
    // {
    //   "master":                "youshallpass",
    //   "usernameField":         "email",
    //   "passwordField":         "password",
    //   "resetSalt":             "$2a$08$Qn0unnOa4XH0pN.IRZHB4u"
    // },
  },
  comm: {
    mode:                    "stub",
    dispatch: {
      transports:            ["smtp"],
      groups:                { errors: "Set If <mode@not.stub>" }
    },
    senders: {
      err:                   { name: "ERR", app: "AP", email: noDefault }
    }
  },
  http: {
    host:                    noDefault,
    port:                    3333,
    static: {
      host:                  '/',
      bundles:               {},
      dirs:                  'public',
      manifest:              null,
      opts:                  { maxAge: null }
    }
  },
  log: {
    app:                     {init:b,verbose:n,lapse:w,sublapse:g,wire:u,require:u,debug:m,error:r,test:u,quiet:u,analytics:u},
    auth:                    {init:n,link:s,create:s,login:s},
    cfg:                     {init:n,route:y},
    comm:                    {init:n,send:g,mail:g,chat:u,err:w},
    modl:                    {init:n,connect:s,read:n,write:n,cache:w},
    mw:                      {init:n,trace:c,impression:n,event:n,view:n,api:g,forward:n,noCrawl:n,valid:m,page:u,notFound:r,error:r,forbid:m,authRedirect:u,oauth:u,logout:u,cached:u,param:u,recast:u,project:u,wrap:u,slow:u,jsonLimit:u,page:u,orient:u,remember:u,logic:u},
    pay:                     {in:g,out:g,method:y},
    trk:                     {init:n,issue:m,impression:n,event:y,view:c},
    wrpr:                    {init:b,call:n,apicall:n}
  },
  logic:                     {},
  middleware: {
    api:                     { baseUrl: '/api' },
    ctx: {
      bot:                   { allow: "googlebot", disallow: "uk_lddc_bot|MJ12bot" },
      dirty:                 false,
      ip:                    true,
      ref:                   true,
      sId:                   true,
      user:                  true,
      ua:                    true,
      utm:                   true,
    },
    session: {
      anonData:              undefined,
      authdData:             '_id name scope',
      cookie:                { httpOnly: true, maxAge: 9000000 },
      name:                  'mirco-consult',
      restrict:              false,
      resave:                false,
      saveUninitialized:     true,
      secret:                'mirco-consulting',
      store: {
        autoReconnect:       true,
        collection:          noDefault
      }
    }
  },
  model: {
    analytics: {
      mongoUrl:              undefined,
      collections: {
        event:               'Event',
        impression:          undefined,
        issue:               undefined,
        view:                undefined
      }
    },
    cache:                   undefined,
    domain: {
      mongoUrl:              noDefault
    }
  },
  routes: {
    redirects:               { on: false },
    whiteList:               { on: false }
  },
  templates: {
    engines:                 'hbs,md',
    dirs: {
      helpers:               undefined,
      partials:              undefined,
      views:                 'views'
    }
  },
  wrappers: {
    dirs:                    undefined,
    smtp:                    undefined,
    ses:                     undefined
  }
}


module.exports = () => {
  defaults.http.port = process.env.PORT || 3333
  var cfg = JSON.parse(JSON.stringify(defaults))
  for (var pattern in cfg.middleware.ctx.bot)
    cfg.middleware.ctx.bot[pattern] = new RegExp(cfg.middleware.ctx.bot[pattern], 'i')
  return cfg
}

