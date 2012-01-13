define([], function(){
// Reactive base constructor for objects that can change in real time in response to being fed changes
	function Reactive(){
	}
	Reactive.prototype = {
		map: function(object){
			// default impl that doesn't do anything
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
			var child = new Reactive;
			child.parent = this;
			return child;
		},
		is: function(value){
			// sets the main value in this reactive, comes from the source, propagates up
			this.value = value;
			var listeners = this.listeners;
			if(listeners){
				for(var i = 0, l = listeners.length;i < l; i++){
					var listener = listeners[i];
					listener.call(self, value);
				}
			}
		},
		push: function(value){
			var children = this.children;
			if(!(children instanceof Array)){
				this.children = children = [];
			}
			// TODO: notify list listeners
			children.push(value);
		},
		then: function(listener){
			if(this.onThen){
				var self = this;
				this.onThen(function(value){
					self.is(self, value);
				});
				// don't call it again
				this.onThen = null;
			}
			(this.listeners || (this.listeners = [])).push(listener);
			listener(this.value);
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
				if(i.charAt(i.length - 1) == '-'){
					listener(this[i]);
				}
			}			
		}
	};
	return Reactive; 	
});