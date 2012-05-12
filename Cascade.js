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
		get: function(key){
			var child = this[key];
			if(!child){
				(this.keySet || (this.keySet = [])).push(key);
				child = this[key] = new Cascade;
			}
			return child;
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
		}
		//getValue: function(callback){
			// the intent of this is that it will only be called once
		//},
		/*override: function(target){
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
			
		}*/
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
	function whenReady(object, callback){
		if(object._isReady && callback){
			return callback();
		}
		if(callback){
			if(object.readyCallbacks){
				return object.readyCallbacks.push(callback);
			}
			object.readyCallbacks = [callback]; 
		}
		if(object.parent && !object.parent._isReady){
			return whenReady(object.parent, proceed);
		}
		// check any waiting promises
/*			var i -
			function
			for(var i = 0; i < object.bases.length; i++){
				var base = bases[i];*/
		if(object.whenReady){
			var objectWhenReady = object.whenReady;
			object.whenReady = null;
			objectWhenReady.call(object, proceed);
		}
		var bases = object.resolveBases ? object.resolveBases() : [];
		var refs = object._refs;
		if(object.bases){
			bases = object.bases.concat(bases);
			refs = Array(object.bases.length).concat(refs); // keep the ordering of the refs in sync with the bases
			object.bases = []; // reset it so that they will be readded
		}
		var waiting = 1;
		
		if(!bases.length || object._isReady){
			object._isReady = true;
			return done()();
		}
		var timeout = setTimeout(function(){
			console.log("Timeout waiting for:");
			for(var i = 0; i < bases.length; i++){
				var base = bases[i];
				if(!base._isReady){
					console.log(base);
				}
			}
		}, 5000);
		for(var i = 0; i < bases.length; i++){
			var base = bases[i];
			var args = (refs[i] || 0).args;
			var alreadyExtended = bases.length
			if(!base._isReady){
				// TODO: eliminate whenReady and use promises from override instead
				waiting++;
				whenReady(base, done(base, args));
			}else{
				 var result = extend(base, object, null, args);
				 if(result && result.then){
				 	waiting++;
				 	result.then(done());
				 }
			}
		}
		object._isReady = true;
		done()();
		function proceed(){
			whenReady(object);
		}
		function done(target, args){
			return function(){
				var result = target && extend(target, object, null, args);
				if(result && result.then){
					return result.then(done());
				}
				waiting--;
				if(!waiting){
					clearTimeout(timeout);
					object._isReady = true;
					var callbacks = object.readyCallbacks;
					for(var i = 0; i < callbacks.length; i++){
						callbacks[i]();
					}
				}					
			}
		}
	}
	function when(target, callback){
		if(target && typeof target == "object"){
			if("value" in target){
				callback(target.value);
				return true;
			}
			if(target._isReady){
				var returned;
				target.getValue ? (returned = target.getValue(callback)) && callback(returned) : callback();
				return true;
			}else{
				whenReady(target, function(){
					return when(target, callback);
				});
			}
		}else{
			callback(target);
		}
	}
	Cascade.is = function(target, key, value){
		var child = get(target, key);
		if(!child){
			child = target[key] = {};
		}
		if(child.is){
			child.is(value);
		}else{
			child.getValue = function(){
				return value;
			};
		}
	}
	var get = Cascade.get = function(target, key, callback){
		if(key.call){
			// get(target,callback) form
			return key ? when(target, key) : target;
		}
		if(target.get){
			var child = target.get(key);
		}else if(key in target){
		// get the reactive child by the given key
			var child = target[key];
		}
		if(child && !child.key){
			child.parent = target;
			child.key = key;
			if(typeof key == "number"){
				key = "each";
			}
			var bases = target.bases;
			if(bases){
				for(var i = 0; i < bases.length; i++){
					// TODO: can instanceChain be just a number?
					extend(get(bases[i], key), child, target.instanceChain ? [target].concat(target.instanceChain) : [target]);
				}
			}
		}
		if(callback){
			if(typeof callback == "string"){
				return get.apply(null, [child].concat([].slice.call(arguments, 2)));
			}
			when(child, callback);
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
		if(ref.args){
			var appliedBase = {
				parent: target.parent,
				whenReady: function(callback){
					whenReady(base, function(){
						var result = base.apply(appliedBase, ref.args);
						result && result.then ?
							result.then(callback) :
							callback();
					});
				}
			};
			return appliedBase;
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
			base._isReady = false;
			base.readyCallbacks = null;
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
			if(base.apply){
				target.apply = base.apply;
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
				if(key == "children"){
					var children = target[key];
					var baseEach = get(base, "each");
					for(var j = 0; j < children.length; j++){
						extend(baseEach, children[j], targets ? [target].concat(targets) : [target]);
					}
				}else{
					extend(get(base, key), target[key], targets ? [target].concat(targets) : [target]);
				}
			}
		}
		return result;
	};
	Cascade.newChild = function(parent, newChild){
		var children = get(parent, "children");
		var childrenArray = (children.value || (children.is([])));
		var newChild;
		childrenArray.push(newChild || (newChild = get(children, childrenArray.length)));
		newChild.parent = parent;
		return newChild;
	};
	Cascade.keys = function(target, listener){
		keys(target, listener);
	};
	var allowAll = {};
	Cascade.allKeys = function(target, listener){
		keys(target, listener, allowAll);
	};
	function keys(target, listener, instance){
		var keySet = target.keySet;
		if(keySet){
			for(var i = 0; i < keySet.length; i++){
				var key = keySet[i];
				if(!(instance && key in instance)){
					listener(key);
				}
			}
		}
		if(instance){
			var bases = this.bases;
			if(bases){
				for(var i= 0; i < bases.length; i++){
					keys(bases[i], listener, target);
				}
			}
		}
	}
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