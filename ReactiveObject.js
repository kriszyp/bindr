define(['./Cascade'], function(Cascade){
	// simple wrapper around JS objects
	function ReactiveObject(value, key, parentValue){
		if(value !== undefined){
			this.is(value);
		}
		this.put = function(value){
			// call set if we can
			parentValue.set ? parentValue.set(key, value) : parentValue[key] = value;
			// set the new value if watch doesn't already do this
			if(parentValue.watch == nativeWatch || !parentValue.set){
				this.is(value);
			}
		};
	};
	var nativeWatch = {}.watch;
	var ReactiveObjectPrototype = ReactiveObject.prototype = new Cascade; 
	ReactiveObjectPrototype.get = function(key){
		var parentValue= this.value;
		if(parentValue){
			// if the object has a (non-native) watch, then we will watch for changes
			if(parentValue.watch != nativeWatch){
				parentValue.watch(key, function(name, oldValue, value){
					// change the value of this reactive
					reactive.is(value);
				});
			}
			// check for get() method, if not use direct property access
			var value = parentValue.get ? parentValue.get(key) : parentValue[key];
		}else{
			// don't cause errors for invalid properties, just keep giving a null (maybe this should be undefined)
			value = null;
		}
		var reactive = new ReactiveObject(value, key, parentValue);
		return reactive;
	};
	
	return ReactiveObject;
});
