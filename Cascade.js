define(['./Reactive'], function(Reactive){
	// Cascading inheritance
	var nextId = 1;
	
	function Cascade(){
	}
	var CascadePrototype = Cascade.prototype = new Reactive; 
	CascadePrototype._createChild = function(key){
		var child = new Cascade();
		child.parent = this;
		child.key = key;
		var listeners = this.keyListeners;
		if(listeners){
			for(var i = 0, l = listeners.length;i < l; i++){
				var listener = listeners[i];
				listener(child);
			}
		}
		return child;
	};
	CascadePrototype.map = function(from, to){
		var fromId = from.id || (from.id = nextId++);
		if(to){
			this['map-' + fromId] = to;
		}else{
			to = this['map-' + fromId] || from;
		}
		var parent = this.parent;
		return parent ? parent.map(to) : to;
	};

	CascadePrototype.baseIterator = function(){
		var bases = this.bases;
		var i = bases ? bases.length : 0;
		var parentIterator;
		var parent = this.parent;
		var myKey = this.key;
		var parentBase, inheritedBase, inheritedIterator, id = nextId++;
		// TODO: move callback arg to baseIterator so we don't need to base it around all the time
		function nextInherited(callback){
			if(inheritedBase){
				callback(inheritedBase);
				inheritedBase = null;
			}
console.log(id, "nextInherited", !!inheritedIterator);
			inheritedIterator(function(base){
console.log(id, "inheritedIterator", !!base);
				if(base){
					// TODO: don't need to map the first one?
					if(base.parent == parentBase){
						// TODO: recurse up parents
						callback(parent.get(base.key));
						inheritedBase = base; // queue this up next
					}else{
						callback(base);
					}
				}else{
					nextParent(callback);
				}
			});
		}
		function nextParent(callback){
console.log(id, "nextParent", !!parentIterator);
			// iterate through the parent's bases
			parentIterator(function(base){
console.log(id, "parentIterator", !!base);
				parentBase = base;
				if(base){
					var childBase = base.get(myKey);
					if(childBase.baseIterator){
						inheritedIterator = childBase.baseIterator();
						nextInherited(callback);
					}else{
						callback();
					}
				}else{
					inheritedIterator = parentIterator; // we are all done, and this is a little trick to make sure that subsequent calls also return undefined
					callback();
				}
			});
		}
		return function next(callback){
			// ? callback(this);
			// first go through our own bases
			console.log(id, "next", !!parent);
			if(bases){
				var base = bases[--i];
				if(base){
					return callback(base, next);
				}
			}
			if(parent){
				if(!parentIterator){
					parentIterator = parent.baseIterator();
//					parentIterator(function(){}); // skip the first since that is us
					nextParent(callback);
				}else{
					nextInherited(callback);
				}
			}else{
				return callback();
			}
		};
	};
	CascadePrototype.put = function(value){
		// put the main value in this reactive, comes from the user, 
		// propagates down (change event propagates back up), by default
		// we send it to our first base (hopefully there isn't more bases)
		this.bases[0].put(value);
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
			if(target = parent[baseName + '-']){
				return target;
			}
			lastParent = parent;
		}
		// we couldn't find the base's name, create it at the global level
		console.log(baseName + " reference not found"); // wait until the global is fully created before giving this error message in case it is declared later
		return lastParent.get(baseName);
		
	};
	CascadePrototype.extend = function(base){
		// the derivitive of my base is me 
		(this.bases || (this.bases = [])).push(base);
		// for each base, we extend all the children that have been cached
		var self = this;
		// TODO: fire base listeners
		
		// TODO: do the conditional search for the primary value through the bases
	};
	CascadePrototype.fulfillScope = function(){
			this.parent.fulfillScope();
			var bases = this.bases,
				scope = this.scope;
			for(var i = 0, l = bases.length; i < l; i++){
				var id = scope[bases[i]];
				this.extend(id);
			}
			
			var properties = this.ast.properties;// iterate through each of these to create our scope
			for(var i = 0, l = properties.length; i < l; i++){
				scope[properties[i]] = 3
			}
			
		};
	CascadePrototype.then = function(listener, errorHandler){
		var listeners = this.listeners;
		if(!listeners){
			var self = this;
			// no listeners, setup the listening mechanism
			listeners = this.listeners = [];
			this.listeningBase = this.bases ? this.bases.length : 0;
			function nextListen(next){
				var nextHandle, thisListenerBase = self.listeningBase,
			 	thisHandle = next(function(base){
			 		if(base){
				 		base.then(function(value){
							if(value === undefined){
								if(thisListenerBase == self.listeningBase){
									var nextListenerBase = --self.listeningBase;
									if(nextListenerBase >= 0){
										nextHandle = nextListen(next);
									}else{
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
									value.create(self);
								}
								// when a new value is provided, we notify all the listeners
								self.is(value);
							}
					 	});
			 		}else{
			 			self.is();
			 		}
			 	});
			 	return {
			 		remove: function(){
			 			thisHandle.remove();
			 			nextHandle && nextHandle.remove();
			 			self.listeningBase++;
			 		}
			 	};
			}
			nextListen(this.baseIterator());
			listeners.push(listener);
		}
		if("value" in this){
			listener(this.value);
		}
	};
	CascadePrototype.keys = function(listener){
		var listeners = (this.keyListeners || (this.keyListeners = []));
		listeners.push(listener);
		for(var i in this){
			if(i.charAt(i.length - 1) == '-'){
				listener(this[i]);
			}
		}
		var bases = this.bases;
		for(var i = 0, l = bases.length; i < l; i++){
			var base = bases[i];
			base.keys(listener);
		}
	};
	return Cascade; 	
});