define(['./Reactive'], function(Reactive){
	// simple wrapper around JS objects
	function ReactiveObject(value){
		this.value = value;
	}
	var ReactiveObjectPrototype = ReactiveObject.prototype = new Reactive; 
	ReactiveObjectPrototype._createChild = function(key){
		return new ReactiveObject(this.value ? this.value[key] : null);
	};
	return ReactiveObject;
});
