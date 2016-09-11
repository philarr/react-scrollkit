var scrollSpy = {

  spyCallbacks: [],
  spySetState: [],
  wait: false,

  mount: function (stateHandler, spyHandler) {
   if (stateHandler) this.addHandler('spySetState', stateHandler);
   if (spyHandler) this.addHandler('spyCallbacks', spyHandler);
  },

  currentPositionY: function () {
    var supportPageOffset = window.pageXOffset !== undefined;
    var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
    return supportPageOffset ? window.pageYOffset : isCSS1Compat ?
            document.documentElement.scrollTop : document.body.scrollTop;
  },

  scrollHandler: function () {
    //throttle scroll event

    if (!this.wait) {
      this.wait = true;
      // copy array to prevent mid-loop mutation
      this.spyCallbacks.slice(0).forEach(function(cb) {
        cb(this.currentPositionY());
      }, this);
 
 
      setTimeout(function() {
        this.wait = false;
      }.bind(this), 100);
    }
  },

  hasHandlers: function() {
    return this.spyCallbacks.length || this.spySetState.length
  },

  addHandler: function(queueKey, handler) {
    if (handler && this[queueKey]) {
      if (document && !this.hasHandlers()) {
        this._scrollHandler = this.scrollHandler.bind(this)
        window.addEventListener('resize', this._scrollHandler);
        document.addEventListener('scroll', this._scrollHandler);
      }
      this[queueKey].push(handler);
    }
  },

  removeHandler: function(queueKey, handler) {
    var queue = this[queueKey] || [];
    var i = queue.indexOf(handler);
    if (i !== -1) {
      queue.splice(i, 1);
    }
    if (document && !this.hasHandlers()) {
      window.removeEventListener('resize', this._scrollHandler);
      document.removeEventListener('scroll', this._scrollHandler);
    }
  },

  updateStates: function(){
    var length = this.spySetState.length;
 
    for(var i = 0; i < length; i++) {
      this.spySetState[i]();
    }
  },

  unmount: function (stateHandler, spyHandler) {

    if (stateHandler) this.removeHandler('spySetState', stateHandler);
    if (spyHandler) this.removeHandler('spyCallbacks', spyHandler);
 
  }
}

module.exports = scrollSpy;
