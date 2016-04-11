global._  = require('lodash')
var SCREAM = require('meanair-scream')
var config = { http: { host: 'test://server.meanair/'} }
var opts = { app: 'empty' }

SCREAM(__dirname, opts).run({config})
