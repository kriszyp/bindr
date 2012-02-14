define(['./Reactive'], function(Reactive){
	// simple wrapper around JS objects
	function ReactiveObject(value){
		this.value = value;
	}
	var nativeWatch = {}.watch;
	var ReactiveObjectPrototype = ReactiveObject.prototype = new Reactive; 
	ReactiveObjectPrototype._createChild = function(key){
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
		var reactive = new ReactiveObject(value);
		return reactive;
	};
	ReactiveObjectPrototype.put = function(value){
		var parentValue = this.parent.value;
		// call set if we can
		parentValue.set ? parentValue.set(this.key, value) : parentValue[this.key] = value;
		// set the new value if watch doesn't already do this
		if(parentValue.watch == nativeWatch || !parentValue.set){
			this.is(value);
		}
	};
	
	return ReactiveObject;
});
