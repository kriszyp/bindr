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
		addRef: function(ref){
			(this._refs || (this._refs = [])).push(ref);
		},
		extend: function(base){
			// DEPRECATED?
			// extend this cascade with the given target
			extend(base, this);
		},
		newChild: function(newChild){
			var children = get(this, "children");
			var childrenArray = (children.value || (children.is([])));
			var newChild;
			childrenArray.push(newChild || (newChild = get(children, childrenArray.length)));
			return newChild;
		},
		waitFor: function(promise){
			(this.waitingOn || (this.waitingOn = [])).push(promise);
		},
		whenReady: function(callback){
			if(callback){
				if(this.readyCallbacks){
					return this.readyCallbacks.push(callback);
				}
				this.readyCallbacks = [callback]; 
			}
			var self = this;
			if(this.parent && this.parent.whenReady){
				return this.parent.whenReady(proceed);
			}
			// check any waiting promises
			var waitingOn = this.waitingOn;
			if(waitingOn && waitingOn.length){
				return waitingOn.shift()(proceed);
			}
			var bases = this.resolveBases();
			var refs = this._refs;
			if(this.bases){
				bases = this.bases.concat(bases);
				refs = Array(this.bases.length).concat(refs); // keep the ordering of the refs in sync with the bases
			}
			var waiting = 1;
			if(!bases.length){
				this.whenReady = null;
				return done()();
			}
			
			for(var i = 0; i < bases.length; i++){
				var base = bases[i];
				var args = (refs[i] || 0).args;
				if(base.whenReady){
					// TODO: eliminate whenReady and use promises from override instead
					waiting++; 
					base.whenReady(done(base, args));
				}else{
					 var result = extend(base, this, null, args);
					 if(result && result.then){
					 	waiting++;
					 	result.then(done());
					 }
				}
			}
			this.whenReady = null;
			done()();
			function proceed(){
				self.whenReady();
			}
			function done(target, args){
				return function(){
					var result = target && extend(target, self, null, args);
					if(result && result.then){
						return result.then(done());
					}
					waiting--;
					if(!waiting){
						var callbacks = self.readyCallbacks;
						for(var i = 0; i < callbacks.length; i++){
							callbacks[i]();
						}
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
				for(var i = 0; i < refs.length; i++){
					var ref = refs[i];
					bases.push(ref.splice ?
							resolve(this, ref) : // if it is an array that indicates it is reference 
							ref);
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
		},
		override: function(target){
			// recursively execute override function for the bases
			var bases = this.bases;
			if(bases){
				for(var i = 0; i < bases.length; i++){
					var base = bases[i];
					if(base.override){
						base.override(target);
					}
				}
			}
			if(this.getValue){
				target.getValue = this.getValue;
			}

			if(this.put){
				target.put = this.put;
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
		if(key.call){
			// get(target,callback) form
			return target.then ? target.then(key) : key ? key(target) : target;
		}
		if(target.get){
			var child = target.get(key);
		}else if(key in target){
		// get the reactive child by the given key
			var child = target[key];
		}else{
			(target.keySet || (target.keySet = [])).push(key);
			var child = target[key] = new Cascade;
		}
		if(!child.key){
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
			if(typeof callback == "string"){
				return get.apply(null, [child].concat([].slice.call(arguments, 2)));
			}
			child.then ? child.then(callback) : callback(child);
		}
		return child;
	};
	Cascade.addBase = function(base, target){
		(base._refs || (base._refs = [])).push(target);
	};
	var resolve = Cascade.resolve = function(target, ref){
		// first we need to make sure the depth has been computed
		var base, depth = ref.depth;
		if(depth > -1){
			var instanceChain = target.instanceChain;
			// second if we are in a different instance chain, we need to go up through the parent chain the proper number of places
			if(instanceChain && depth < instanceChain.length){
				base = instanceChain[depth];
			}else{
				base = target;
				for(var i = 0; i <= depth; i++){
					base = base.parent;
				}
			}
		}else{
			// need to determine the depth, can get the base in the process
			var parent = target;
			var depth = 0;
			var firstRef = ref[0];
			while(parent = parent.parent){
				base = parent;
				if(firstRef in parent && parent[firstRef] != target){
					break;
				}
				depth++;
			}
			ref.depth = depth;
		}
		for(var j = 0; j < ref.length; j++){
			base = get(base, ref[j]);
		}
		return base;
	};
	var extend = function(base, target, targets, args){
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
			var result = base.override(target, args);
		}else{
			// TODO: this might be eliminitable
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
		// TODO: Do we need to wait on promise returned from override functions before setting these keys?
		var keySet = target.keySet;
		if(keySet){
			for(var i = 0; i < keySet.length; i++){
				var key = keySet[i];
				extend(get(base, key), target[key], targets ? [target].concat(targets) : [target]);
			}
		}
		return result;
	};
	function startValue(target){
		this.value = {};
		var oldGetValue = this.getValue;
		this.getValue = function(){
			return this.value.getValue();
		}
		return oldGetValue;
	}
	
	return Cascade;
	 	
});