var vows		= require("vows"),
	assert		= require("assert"),
	TestEmitter = function() {};

require("util").inherits(TestEmitter, require("../lib/asyncevents").AsyncEventEmitter);
var emitter = new TestEmitter();

vows.describe("AsyncEventEmitter").addBatch({
	options: {
		error: false
	},
	"a synchronous handler": {
		topic: function() {
			var handler = function() {
				handler.called = true;
				handler.args = arguments;
			};
			return handler;
		},

		"is fired.": {
			topic: function(handler) {
				emitter.on("syncevent", handler);
				emitter.emitAsync("syncevent", this.callback, 123);
			},

			"the handler": {
				topic: function(result, handler) {
					return handler;
				},

				"is called": function(handler) {
					assert.isTrue(handler.called);
				},
				
				"receives correct arguments": function(handler) {
					assert.equal("[object Arguments]", Object.prototype.toString.call(handler.args));
					assert.equal(handler.args[0], 123);
				}
			},
			
			"the callback": {
				topic: function(result) {
					return result;
				},

				"should return false": function(result) {
					assert.isFalse(result)
				},
			}
		},
	},
	"an asynchronous handler": {
		topic: function() {
			var handler = function() {
				var callback = this.deferHandler();
				
				process.nextTick(function() {
					callback();
				});
			}

			return handler;
		},
		"is fired.": {
			topic: function(handler) {
				emitter.on("asyncevent", handler);
				emitter.emitAsync("asyncevent", this.callback, 123);
			},
			
			"the callback": {
				topic: function(result) {
					return result;
				},

				"should return false": function(result) {
					assert.isFalse(result)
				}
			}
		}
	},
	
	"an error-prone handler": {
		topic: function() {
			var handler = function() {
				var callback = this.deferHandler();
				
				process.nextTick(function() {
					callback(new Error("Error."));
				});
			}

			return handler;
		},
		
		"is fired.": {
			topic: function(handler) {
				// We have to wrap the resulting callback before we give it to this.callback, since vows gets angry when a callback is passed an error...
				var self = this;
				emitter.on("errorevent", handler);
				emitter.emitAsync("errorevent", function(result) { self.callback(null, result); }, 123);
			},
			
			"the callback": {
				topic: function(result) {
					return result;
				},

				"should contain the error": function(result) {
					assert.instanceOf(result, Error);
				}
			}
		}
	},
	"two synchronous handlers are registered": {
		topic: function() {
			var createHandler = function() {
				var handler = function() {
					handler.called = true;
					return true;
				}
				
				emitter.on("cancelsynchandler", handler);
				return handler;
			};
			
			return {
				first: createHandler(),
				second: createHandler()
			};
		},

		"and fired.": {
			topic: function(handlers) {
				var that = this;
				emitter.emitAsync("cancelsynchandler", this.callback);
			},
			"the first handler": {
				topic: function(handlers) {
					return handlers.first;
				},
				"should have been fired": function(firstHandler) {
					assert.isTrue(firstHandler.called);
				}
			},
			"the second handler": {
				topic: function(handlers) {
					return handlers.second;
				},
				"should *not* have been fired": function(secondHandler) {
					assert.isUndefined(secondHandler.called);
				}
			}
		}
	}
}).export(module);
