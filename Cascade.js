define(['./Reactive'], function(Reactive){
	// Cascading inheritance
	var nextId = 1;


	function Cascade(){
	}
	var CascadePrototype = Cascade.prototype = new Reactive; 
	CascadePrototype._createChild = function(key){
		var child = new Cascade();
		var listeners = this.keyListeners;
		if(listeners){
			for(var i = 0, l = listeners.length;i < l; i++){
				var listener = listeners[i];
				listener(child);
			}
		}
		return child;
	};
	CascadePrototype.put = function(value){
		// put the main value in this reactive, comes from the user, 
		// propagates down (change event propagates back up), by default
		// we send it to our first base (hopefully there isn't more bases)
		this.eachBase(function(base){
			if(base.put){
				base.put(value);
				return true;
			}
		});
	};
	CascadePrototype.set = function(name, value){
		var reactive = new Reactive;
		reactive.is(value);
		this.get(name).put(reactive);
	}
	CascadePrototype.create = function(){
		// creates a new instance of this Reactive
		var instance = new Reactive(this.ast, parentScope);
		instance.bases = [this];
	};
	CascadePrototype.call = function(){
		// when this is called with consecutive arguments, we apply them to the keys in the order they appear
		var cascade = new Cascade;
		cascade.extend(this);
		var args = arguments, i = 0;
		this.keys(function(key){
			cascade.get(key).is(args[i++]);
			return i >= args.length; // tell it we are done
		});
	};
	CascadePrototype.resolve = function(baseName){
		var lastParent = this;
		var target;
		var parent;
		while(parent = lastParent.parent){
			// TODO: Wait for the parent scope to be ready
			// search through scopes until we find the base's name
			if(parent[baseName + '-']){
				return parent;
			}
			lastParent = parent;
		}
		// we couldn't find the base's name, create it at the global level
		console.log(baseName + " reference not found"); // wait until the global is fully created before giving this error message in case it is declared later
		return lastParent;
		
	};
	CascadePrototype.extend = function(base, path){
		if(path){
			base = {parent: base, path: path};
		}
		// the derivitive of my base is me 
		(this.bases || (this.bases = [])).push(base);
		// for each base, we extend all the children that have been cached
		var self = this;
		// TODO: fire base listeners
		var baseListeners = this.baseListeners || 0;
		for(var i = 0; i < baseListeners.length; i++){
			baseListeners[i](base);
		}
		// TODO: do the conditional search for the primary value through the bases
	};
	
	CascadePrototype.waitFor = function(promise){
		(this.waitingOn || (this.waitingOn = [])).push(promise);
	};
	CascadePrototype.then = function(listener, errorHandler){
		var listeners = this.listeners;
		if(!listeners){
			var self = this;
			listeners = this.listeners = [];
			// no listeners, setup the listening mechanism
			var listeners = this.listeners;
			this.listeningBase = this.bases ? this.bases.length : 0;
			var nextHandle, thisListenerBase = this.listeningBase;
			this.eachBase(function(base){
				var done;
		 		base.then(function(value){
					if(value === undefined){
						if(thisListenerBase == self.listeningBase){
							var nextListenerBase = --self.listeningBase;
							if(nextListenerBase < 0){
								self.listeningBase++; // revert the index change
								self.is(); // call with undefined as the value
							}
						}
					}else{
						if(self.listeningBase < thisListenerBase){
							// stop listening to the next bases if we don't need them
							nextHandle && nextHandle.remove();
						}
						if(value && value.create){
							value = value.create(self);
						}
						// when a new value is provided, we notify all the listeners
						self.is(value);
						done = true;
					}
			 	});
			 	return done;
	/*			 	return {
				 		remove: function(){
				 			thisHandle.remove();
				 			nextHandle && nextHandle.remove();
				 			self.listeningBase++;
				 		}
				 	};*/
			}, 0, 0, true);
		}
		listeners.push(listener);
		if("value" in this){
			listener(this.value);
		}
	};
	CascadePrototype.eachBase = function(callback, forInstance, forBases, excludeSelf, waitingOn){
		if(!waitingOn){
			waitingOn = this.waitingOn || [];
			waitingOn.parent = this.parent;
		}
		function forBase(base){
			var parent = base.parent;
			var path = base.path;
			if(path){
				if(forInstance && forBases.indexOf(parent) > -1){ // Need to recurse
					parent = forInstance;
				}
				base = parent;
				for(var j = 0; j < path.length; j++){
					base = base.get(path[j]);
				}
			}
			if((!excludeSelf || !base.eachBase) && callback(base)){
				return true;
			}
			if(base.eachBase && base.eachBase(callback, forInstance, null, true)){
				return true;
			}			
		}
		(this.baseListeners || (this.baseListeners = [])).push(forBase); 
		var scope, args = arguments;
		while(true){
			if(waitingOn.length){
				var next = waitingOn.shift();
				var self = this;
				return next(function(){
					args[4] = waitingOn;
					args.length = 5;
					args.callee.apply(self, args);
				});
			}else if((scope = waitingOn.parent)){
				waitingOn = scope.waitingOn || [];
				waitingOn.parent = scope.parent;
			}else{
				// done waiting for all the necessary async actions to finish
				var bases = this.bases || 0;
				for(var i = bases.length; i > 0;){
					i--;
					if(forBase(bases[i])){
						return true;
					}
				}
				var key = this.key;
				var parent = this.parent;
				var parents = parent && [];
				return parent && parent.eachBase &&parent.eachBase(function(parentBase){
					parents.push(parentBase);
					var nextBase = parentBase.get(key);
					return nextBase.eachBase ? nextBase.eachBase(function(base){
						return callback(base);
					}, parent, parents, true) : callback(nextBase);
				});
			}
		}
	};
	/* If you need inherited keys, you will need to iterate through the bases
	CascadePrototype.keys = function(listener){
		Reactive.prototype.keys.call(this, listener);
		this.eachBase(function(base){
			base.keys && base.keys(listener);
		},0,0, true);
	};*/
	return Cascade; 	
});