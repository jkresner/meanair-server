const undefine = '{{undefine}}'
var atBottom = val => typeof val !== 'object' || val.constructor === Array

module.exports = $logIt =>

/**
* Recursively traverses and merges
* @param defaults (meanair default base config)
* @param overrides (application specific sections / exclusions
* @param key to check for environment values to apply
* @return configuration values at the bottom which merge back into subsections of config
*/
function set(key, defaults, overrides) {
  key = key ? key.toUpperCase() : null
  if (overrides === undefined || overrides == undefine || process.env[key] == undefine)
    return undefine

  var config = defaults

  var atOverrideVal = overrides === null ? false : atBottom(overrides)
  var atDefaultVal = defaults === null || atBottom(defaults)
  if (atOverrideVal || atDefaultVal) {
    if (process.env[key] !== undefined) config = process.env[key]
    else if (overrides !== null) config = overrides

    if (config == '{{required}}')
      throw Error(`Configure failed. Override or environment var required for config.${key}`)

    if (config === false || config && atBottom(config)) {
      $logIt(key, config)
      return config
    }
  }

  for (var attr in defaults) {
    var childKey = key ? `${key}_${attr}` : attr
    var childOverrides = overrides && overrides.hasOwnProperty(attr) ? overrides[attr] : null
    config[attr] = set(childKey, defaults[attr], childOverrides)
    if (config[attr] == undefine)
      delete config[attr]
  }

  for (var attr in overrides) {
    if (!(defaults||{}).hasOwnProperty(attr)) {   // && overrides[attr]
      var childKey = key ? `${key}_${attr}` : attr
      config[attr] = set(childKey, null, overrides[attr])
      if (config[attr] == undefine)
        delete config[attr]
    }
  }

  return config
}

