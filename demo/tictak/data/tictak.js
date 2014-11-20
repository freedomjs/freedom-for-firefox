/*globals freedom*/
/**
 * This is the root module of freedom.js.
 * It runs in an isolated thread with its own namespace.
 * The root module has a special object 'freedom', which
 * is used to provide the interface defined in manifest.json
**/
var Tictak = function (dispatchEvents, base) {
  'use strict';
  this.dispatchEvent = dispatchEvents;
  this.num = base;
  this.dispatchEvent('update', this.num);
};

Tictak.prototype.click = function (num) {
  'use strict';
  this.num += num;
  this.dispatchEvent('update', this.num);
};

freedom().provideSynchronous(Tictak);
