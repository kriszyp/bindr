define([], function(){
// Reactive base constructor for objects that can change in real time in response to being fed changes
	var nextId = 1;
	
	function Reactive(parentMap){
		var self = this;
		this.id = nextId++;
		var map = this.map = function(object, mapped){
			if(mapped){
				map[object.id] = mapped;
				// add it to the inheritance chain to the object
				var bases = (mapped.bases || (mapped.bases = []));
				bases.push(object);
				bases["has-" + object.id] = object;
			}else{
				// see if it is already mapped
				mapped = map[object.id];
				if(!mapped){
					// check to see if it is one of the children of our bases
					var bases = self.bases;
					if(bases){
						var parent = object;
						do{
							if(bases['has-' + parent.id]){
								// it is a child
								break;
							}
							parent = parent.parent;
						}while(parent);
						if(parent){
							// add the mapping
							return map(object, new Reactive(map));
						}
					}
					mapped = object;
				}
			}
			return parentMap ? parentMap(mapped) : mapped;
		};
	}
	Reactive.prototype = {
		get: function(key, bases){
			// get the reactive child by the given key within the context of the given bases
			// to make a new key use an empty bases array
			var bases = this.bases;
			
			for(var i = 0, l = bases.length; i < l; i++){
				var base = bases[i];
				var id = base.scope[key + '-'];
				if(id){
					break;
				}
			}
			if(!id){
				id = this.scope[key] = nextId++;
			}
			return this.getById(id);
		},
	
		map: function(object){
			// default impl that doesn't do anything
			return object;
		},
		get: function(key){
			// get the reactive child by the given key
			suffixedKey = key + '-';
			if(suffixedKey in this){
				return this[suffixedKey];
			}
			return this[suffixedKey] = this._createChild(key);
		},
		_createChild: function(key){
			var map = this.map;
			var child = new Reactive(map);
			child.parent = this;
			var bases = this.bases;
			if(bases){
				for(var i = 0, l = bases.length; i < l; i++){
					var base = bases[i];
					map(map(base.get(key)), child);
				}
			}
			var listeners = this.keyListeners;
			if(listeners){
				for(var i = 0, l = listeners.length;i < l; i++){
					var listener = listeners[i];
					listener(child);
				}
			}
			return child;
		},
		is: function(value){
			// sets the main value in this reactive, comes from the source, propagates up
			this.value = value;
			if(this.notify){
				this.notify(value);
			}
		},
		put: function(value){
			// put the main value in this reactive, comes from the user, 
			// propagates down (change event propagates back up), by default
			// we send it to our first base (hopefully there isn't more bases)
			this.bases[0].put(value);
		},
		create: function(){
			// creates a new instance of this Reactive
			var instance = new Reactive(this.ast, parentScope);
			instance.bases = [this];
		},
		extend: function(baseName){
			var lastParent = this;
			var base;
			// do we really need to accept a string or reactive?
			if(typeof baseName == "string"){
				while(parent = lastParent.parent){
					// TODO: Wait for the parent scope to be ready
					// search through scopes until we find the base's name
					if(base = parent[baseName + '-']){
						break;
					}
					lastParent = parent;
				}
				if(!base){
					// we couldn't find the base's name, create it at the global level
					console.log(baseName + " reference not found"); // wait until the global is fully created before giving this error message in case it is declared later
					base = lastParent.get(baseName);
				}
			}else{
				base = baseName;
			}
	
			// the derivitive of my base is me 
			this.map(base, this);
			// for each base, we extend all the children that have been cached
			var self = this;
			for(var i in this){
				// TODO: if it is a child, then extend the child properly
				
			}
			
			// TODO: do the conditional search for the primary value through the bases
		},
		fulfillScope: function(){
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
			
		},
		then: function(listener, errorHandler){
			if(this.onThen){
				var self = this;
				this.onThen(function(value){
					provide(self, value);
				});
				// don't call it again
				this.onThen = null;
			}
			var listeners = this.listeners;
			if(!listeners){
				var self = this;
				// no listeners, setup the listening mechanism
				listeners = this.listeners = [];
				var notifyAll = function(value){
					// when a new value is provided, we notify all the listeners
					self.computedValue = value;
					for(var i = 0, l = listeners.length;i < l; i++){
						var listener = listeners[i];
						listener.call(self, value);
					}
				};
				
				this.listeningBase = this.bases ? this.bases.length : 0;
				function nextListen(thisBase){
					var nextHandle, thisListenerBase = self.listeningBase,
				 	thisHandle = thisBase.then(function(value){
						if(value === undefined){
							if(thisListenerBase == self.listeningBase){
								var nextListenerBase = --self.listeningBase;
								if(nextListenerBase >= 0){
									nextHandle = nextListen(self.bases[nextListenerBase]);
								}else{
									self.listeningBase++; // revert the index change
									notifyAll(); // call with undefined as the value
								}
							}
						}else{
							if(self.listeningBase < thisListenerBase){
								// stop listening to the next bases if we don't need them
								nextHandle && nextHandle.remove();
							}
							notifyAll(value);
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
				nextListen({then: function(listener){
					self.notify = listener;
				}});
				this.notify(this.value);
				listeners.push(listener);
			}
			listener(this.computedValue);
			return {
				remove: function(){
					for(var i = 0, l = listeners.length;i < l; i++){
						if(listeners[i] == listener){
							listeners.splice(i, 1);
							return;
						}
					}
				}
			};
		},
		keys: function(listener){
			var listeners = (this.keyListeners || (this.keyListeners = []));
			listeners.push(listener);
			for(var i in this){
				if(i.charAt(i.length - 1) = '-'){
					listener(this[i]);
				}
			}
			var bases = this.bases;
			for(var i = 0, l = bases.length; i < l; i++){
				var base = bases[i];
				base.keys(listener);
			}
		}
	};
	return Reactive; 	
});