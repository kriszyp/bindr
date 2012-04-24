define([], function(){
	function Reactive(){
	}
	Reactive.prototype = {
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
		getValue: function(listener){
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
		}
	};
	return Reactive; 	
});