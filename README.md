# Asynchronous Event Emitter

## What?

An augmented version of the standard EventEmitter that exposes an additional function: emitAsync.

emitAsync will fire each handler in a non-parallel manner (each handler has to finish before the next will be fired).

## Why?!

... Because I can!

Seriously though, use this if you want to handle events, but don't want execution to continue until all handlers have completed their (possibly) asynchronous handler logic.

## How?

Observe, a different approach to http middleware.

** An event producer: httpServer.js **
	var RequestHandler = function(req, res) {
		// ... a request has come in.
		// We want to let all interested parties know the a request has come in, and let one of them register a method to respond to the event.
		this.emitAsync("request", function(err) {
			if(!err) req.responder(res);
			else response500(err);
		}, req, res);
	}
	
	util.inherits(RequestHandler, AsyncEventEmitter);
	
	var requestModule = new RequestHandler();
	var httpServer = require("http").createServer();
	httpServer.listen(80);


** An async event consumer: staticFile.js **
	requestModule.on("request", function(req) {
		// Gonna need to see if the file exists locally.
		var callback = this.deferHandler();
		
		fs.exists(someReferenceToDocumentRoot + url.parse(req.url).pathname, function(exists) {
			// Invoking callback() with no arguments (or false, null, undefined) will transfer control to next handler.
			if(!exists) return callback();

			fs.readFile(someReferenceToDocumentRoot + url.parse(req.url).pathname, function(err, data) {
				// Invoking the callback with an error will immediately stop any further handler execution, and call the emit callback with the exception.
				if(err) return callback(err);
				
				req.responder = function(res) {
					res.writeHead(200 /* http headers here*/);
					res.end(data);
				};

				// Invoking the callback with true ensures no further handlers are executed.
				callback(true);
			});
		});
	});

** A synchronous event consumer: helloworld.js **
	requestModule.on("request", function(req) {
		var handled = false;
		if(/\.hello$/.test(req.url)) {
			req.responder = function(res) {
				res.writeHead(200 /* http headers here*/);
				res.end("Hello, world!");
			}; 
			handled = true;
		}
		
		// Returning true will ensure no further handlers in the chain are executed.
		return handled;
	});

## Promises? Futures?

Could achieve the same result in a way, yes. However asynchronous event handling is more specific to .... handling event emitting in an asynchronous manner. Also, using this method gives you a formal way to terminate an event in much the same way as you would in the W3C event model. Finally, this model supports handlers being both asynchronous and synchronous.

## Issues

Probably a few. If you find anything please let me know, or fix it yourself and push the changes to me.

## Maybe TODO

One issue is if handler is deferred, and the resulting callback is not invoked, then the emit() callback will never be called. This could potentially leave HTTP requests/whatever in an eternal wait. Perhaps a timeout should be worked in somewhere.