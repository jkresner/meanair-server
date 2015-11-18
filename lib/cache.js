function hashById(list)
{
  var hash = []
  for (var o of list) hash[o._id] = o
  return hash
}


var cache = {}


cache.flush = function(key, cb)
{
  for (var item in cache) {
    //-- E.g flush 'posts' might flush more than one item e.g. 'posts' && 'postsPublished'
    if (item.indexOf(key) == 0) {
      delete cache[item]
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


module.exports = cache
