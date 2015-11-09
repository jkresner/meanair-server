'use strict';
require('colors')


class Server {


  constructor() {
    this.plumber = require('./plumber')
    this.plumber.logic = require('./logic')(this.plumber)
  }


  get Setup() {
    // console.log('getting setup'.white)
    return function() {
      // console.log('require setup'.yellow)
      return require('./setup').apply(this, arguments) }
  }

  get App() {
    var self = this
    return {
      init: function() {
        // console.log('require app.ini'.yellow, self)
        return require('./app.init').apply(self, arguments) }
    }
  }


}


module.exports = new Server()
