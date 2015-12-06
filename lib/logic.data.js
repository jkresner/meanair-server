'use strict';

var {TypesUtil} = require('meanair-shared')

// -- Shared bits across all data helpers (in an app)
var Shared = { projections: { } }


class Projector {

  constructor(views, projections) {

    this.assign = Object.assign
    this.inflate = {}
    var smartMap = fn => function(input) {
      //-- Can skip writing gaurd code in each projection
      if (input == null) return
      //-- Can write for items and also utilize for array inputs
      return input.constructor === Array ? input.map(r => fn(r)) : fn(input)
    }
    this.map = (input, fn) => smartMap(fn)(input)

    //-- Arbitrarily select properties from source objects passed as space
    //-- delimitered string
    //-- =>   select(obj, 'name email company.name')
    this.select = function() { return _.selectFromObj.apply(null, arguments) }

    //-- Dor each view create default shorthands
    //-- =>   select[viewName](obj)
    Object.keys(views).forEach(name => {
      this.select[name] = smartMap(r => _.selectFromObj(r, views[name]))
    })

    //-- Helper to chain projections in serial order
    //-- First argument is the source object/data to project, followed by
    //-- variable number of params repesenting projections to perform
    var self = this
    this.chain = function() {
      var args = [].slice.call(arguments)
      var r = args.shift()
      while (args.length > 0) {
        var projection = args.shift()
        if (projection.constructor === String) {
          projection = self[projection] || Shared.projections[projection]
        }
        r = projection(r)
      }
      return r
    }

    var singleItemProjections = projections(this, TypesUtil)

    for (var name in singleItemProjections)
      this[name] = (fn =>
        function(src) {
          //-- So we can skip gaurd code in each project function
          if (src == null) return
          //-- So we can automatically also utilize projections for array inputs
          return src.constructor === Array ? src.map(r => fn(r)) : fn(src)
        }
      )(singleItemProjections[name])
  }

}


class DataHelper {

  constructor(views, projections, queries, queryOpts) {

    // this.views    = views
    this.Project  = new Projector(views, projections)
    this.Query    = queries || {}
    this.Opts     = queryOpts || {}

    return this
  }

  addCacheInflate(key, attrs) {

    this.Project.inflate[key] = raw => {
      if (raw[key])
        raw[key].map(o => Object.assign(o,
          attrs ? _.pick(cache[key][o._id]||{}, attrs) : cache[key][o._id]||{} ))
      return raw
    }

    return this
  }

  shareProjections(suffix, names) {

    for (var name of names.split(' '))
      Shared.projections[`$${suffix}.${name}`] = this.Project[name]

    return this
  }

}

module.exports = DataHelper
