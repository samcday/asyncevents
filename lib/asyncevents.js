/**
 * Augmented EventEmitter that supports async event callbacks.
 */
var util	= require("util"),
	events	= require("events");

module.exports = events;

var AsyncEventEmitter = events.AsyncEventEmitter = function() {};
util.inherits(module.exports.AsyncEventEmitter, events.EventEmitter);

AsyncEventEmitter.prototype.deferHandler = function() {
	throw new Error("deferHandler() cannot be called in a synchronous emit().");
};

/**
 * Emits an event that will be handled asynchronously.
 */
AsyncEventEmitter.prototype.emitAsync = function(type, callback) {
	var oldDeferHandler = this.deferHandler;

	// Shameless copy/paste follows.
	try {
		// If there is no 'error' event listener then throw.
		if (type === 'error') {
			if (!this._events || !this._events.error
					|| (isArray(this._events.error) && !this._events.error.length)) {
				if (arguments[2] instanceof Error) {
					throw arguments[2]; // Unhandled 'error' event
				} else {
					throw new Error("Uncaught, unspecified 'error' event.");
				}
			}
		}

		if (!this._events) return callback();
		var handler = this._events[type];
		if (!handler) return callback();

		if(!Array.isArray(handler)) handler = [handler];

		var args = Array.prototype.slice.call(arguments, 2);
		var listeners = handler.slice();
		var self = this;
		var wait = false;

		var fireNextListener = function() {
			var res = listeners.shift().apply(self, args);
			if(res === true) {
				next = function(){};
				callback();
			}

			if(!wait) next();
		};

		var next = function(cancel) {
			wait = false;
			cancel = cancel || !(listeners.length);
			cancel ? callback((cancel === true) ? false : cancel) : fireNextListener();
		};

		// Setup deferHandler().
		this.deferHandler = function() {
			wait = true;
			return next;
		};

		next();
	}
	catch(e) {
		// Restore default deferHandler().
		this.deferHandler = oldDeferHandler;
		throw e;
	}
};
