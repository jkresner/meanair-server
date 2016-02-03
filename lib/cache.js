function hashById(list)
{
  var hash = []
  for (var o of list) hash[o._id] = o
  return hash
}


var cache = {}


cache.flush = function(pattern)
{
  for (var key in cache) {
    //-- E.g flush 'posts' might flush more than one item e.g. 'posts' && 'postsPublished'
    if (key.match(pattern)) {
      delete cache[key]
      $logIt('model.cache', `cache:flush ${item}`)
    }
  }
}


cache.collectionReady = function(name, getForCacheFn, hashFn, cb)
{
  if (cache[name] != null) return cb()

  if (!cb && hashFn.constructor === Function) {
    cb = hashFn
    hashFn = hashById
  }
  getForCacheFn( (e, list) => {
    // $log('cache', name, e, list)
    $logIt('model.cache', `cache:set ${name}`)
    cache[name] = (hashFn||hashById)(list)
    cb()
  })
}


cache.get = function(key, getForCacheFn, cb) {
  if (cache[key]) return cb(null, cache[key])

  $logIt('model.cache', `cache:set item[${key}]`)
  getForCacheFn( (e,r) => {
    if (e) return cb(e)
    cache[key] = r
    cb(null, r)
  })
}



module.exports = cache
