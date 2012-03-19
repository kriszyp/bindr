define([], function(){
	function Tmp(){}
	function delegate(object){
		Tmp.prototype = object;
		return new Tmp;
	}
	// Cascasde base constructor for objects that can change in real time in response to being fed changes
	function Cascade(){
	}
	Cascade.prototype = {
		get: function(key, callback){
			// get the reactive child by the given key
			if(key in this){
				var child = this[key];
			}else{
				(this.keySet || (this	.keySet = [])).push(key);
				var child = this[key] = new Cascade;
				child.parent = this;
				child.key = key;
				var bases = this.bases;
				if(bases){
					for(var i = 0; i < bases.length; i++){
						// TODO: can instanceChain be just a number?
						extend(get(bases[i], key), child, this.instanceChain ? [this].concat(this.instanceChain) : [this]);
					}
				}
			}
			if(callback){
				child.then ? child.then(callback) : callback(child);
			}
			return child;
		},
		addRef: function(ref){
			(this._refs || (this._refs = [])).push(ref);
		},
		extend: function(base){
			// DEPRECATED?
			// extend this cascade with the given target
			extend(base, this);
		},
		newChild: function(){
			var children = get(this, "children");
			var childrenArray = (children.value || (children.is([])));
			var newChild;
			childrenArray.push(newChild = get(children, childrenArray.length));
			return newChild;
		},
		waitFor: function(promise){
			(this.waitingOn || (this.waitingOn = [])).push(promise);
		},
		whenReady: function(callback){
			var self = this;
			if(this.parent && this.parent.whenReady){
				return this.parent.whenReady(proceed);
			}
			// check any waiting promises
			var waitingOn = this.waitingOn;
			if(waitingOn && waitingOn.length){
				return waitingOn.shift()(proceed);
			}
			// TODO: need to handle concurrent whenReady requests
			var bases = this.resolveBases();
			if(this.bases){
				bases = this.bases.concat(bases);
			}
			if(!bases.length){
				this.whenReady = null;
				return callback();
			}
			
			var waiting = 1;
			for(var i = 0; i < bases.length; i++){
				var base = bases[i];
				base.whenReady ?
					 waiting++ && base.whenReady(done(base)) :
					 extend(base, this);
			}
			this.whenReady = null;
			done()();
			function proceed(){
				self.whenReady(callback);
			}
			function done(target){
				return function(){
					target && extend(target, self);
					waiting--;
					if(!waiting){
						callback();
					}					
				}
			}
		},
		resolveBases: function(){
			if(this.fromParentBase){
				this.fromParentBase.resolveBases();
			}
			var refs = this._refs;
			if(refs){
				var bases = [];
				var instanceChain = this.instanceChain;
				for(var i = 0; i < refs.length; i++){
					var ref = refs[i];
					if(ref.splice){ // if it is an array
						// first we need to make sure the depth has been computed
						var base, depth = ref.depth;
						if(depth > -1){
							// second if we are in a different instance chain, we need to go up through the parent chain the proper number of places
							if(instanceChain && depth < instanceChain.length){
								base = instanceChain[depth];
							}else{
								base = this;
								for(var i = 0; i <= depth; i++){
									base = base.parent;
								}
							}
						}else{
							// need to determine the depth, can get the base in the process
							var parent = this;
							var depth = 0;
							while(parent = parent.parent){
								base = parent;
								if(ref[0] in parent){
									break;
								}
								depth++;
							}
							ref.depth = depth;
						}
						for(var j = 0; j < ref.length; j++){
							base = get(base, ref[j]);
						}
					}else{
						base = ref;
					}
					bases.push(base);
				}
				return bases;
			}
			return [];
		},
		is: function(value){
			this.bases = [];
			this.value = value;
			this.getValue = function(callback){
				callback(value);
			}
			return value;
		},
		//getValue: function(callback){
			// the intent of this is that it will only be called once
		//},
		then: function(callback){
			if("value" in this){
				callback(this.value);
				return true;
			}
			if(!this.whenReady){
				var returned;
				this.getValue ? (returned = this.getValue(callback)) && callback(returned) : callback();
				return true;
			}else{
				var self = this;
				this.whenReady(function(){
					return self.then(callback);
				});
			}
		},
		keys: function(listener){
			var keySet = this.keySet;
			if(keySet){
				for(var i = 0; i < keySet.length; i++){
					var key = keySet[i];
					listener(this[key]);
				}
			}		
		}
	};
/*
	this.get("or").getValue = function(callback){
		this.get('children', function(children){
			for(var i = 0; i < children.length; i++){
				var child = children[i];
				if(child){
					return callback(child);
				}
			}
		});
	};
	var Dijit;
	this.get("some-dijit").override = function(target){
		target.clazz = target.clazz ? dojo.declare([Dijit, target.clazz]) : Dijit; 
		target.getValue = function(callback){
			return new this.clazz(this);
		}
	};
	*/
	
	var get = Cascade.get = function(target, key, callback){
		if(target.get){
			return target.get(key, callback);
		}
		// get the reactive child by the given key
		if(key in target){
			var child = target[key];
		}else{
			(target.keySet || (target	.keySet = [])).push(key);
			var child = target[key] = new Cascade;
			child.parent = target;
			child.key = key;
			var bases = target.bases;
			if(bases){
				for(var i = 0; i < bases.length; i++){
					// TODO: can instanceChain be just a number?
					extend(get(bases[i], key), child, this.instanceChain ? [this].concat(this.instanceChain) : [this]);
				}
			}
		}
		if(callback){
			child.then ? child.then(callback) : callback(child);
		}
		return child;
	};
	Cascade.addBase = function(base, target){
		(base._refs || (base._refs = [])).push(target);
	};
	var extend = function(base, target, targets){
		if(typeof base != "object"){
			return base !== undefined && target.is(base);
		}
		if(targets){
			var newBase = delegate(base);
			newBase.fromParentBase = base;
			base = newBase;
		//target.extend(base);
			base.instanceChain = targets;
			base.whenReady = Cascade.prototype.whenReady;
		}
		//base.resolveBases();
		(target.bases || (target.bases = [])).push(base);
		if(base.override){
			// allow for more sophisticated overrides than simply getValue replacemetns
			base.override(target);
		}else{
			if(base.getValue){
				target.getValue = base.getValue;
			}
			if(base.put){
				target.put = base.put;
			}
		}
//			if(target.extend){ // this can be used by type constraints to constrain override values
//				target.extend(this);
//		}
		var keySet = target.keySet;
		if(keySet){
			for(var i = 0; i < keySet.length; i++){
				var key = keySet[i];
				extend(get(base, key), target[key], targets ? [target].concat(targets) : [target]);
			}
		}
	};
	return Cascade;
	 	
});

/*define(['./Reactive'], function(Reactive){
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
			// TODO: Wait for the parent scope to be whenReady
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
	return Cascade; 	
});*/

