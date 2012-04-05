/*
my-range: range + source/rating {
	min: 1;
	max: 10;
}
 */	

define(['./Cascade', 'dojo/_base/declare', './element'], function(Cascade, declare, element){
	var get = Cascade.get;
	// TODO: create widget module 
/*	adaptWidget("list", "dgrid/List");
	adaptWidget("grid", "dgrid/Grid");	
	adaptWidget("calendar", "dijit/Calendar");	
	adaptWidget("color-palette", "dijit/ColorPalette");	
	adaptWidget("range", "dijit/HorizontalSlider", "input[type=range]");*/
	// TODO: Maybe put this all in a .br file?
	/*
range: widget {
	native: 'input[type=range]';
	module: 'dijit/HorizontalSlider';	
}
	 */
	return {
		override: function(target, args){
			if(args){
				var clazz = [args[0].join('/')];
				clazz = target.clazz = this.clazz ? this.clazz.concat(clazz) : clazz;
				get(target, '-element').getValue = function(callback){
					var self = this;
					require(clazz, function(){
						Widget = arguments.length == 1 ? arguments[0] : declare([].slice.call(arguments,0), {});
						var prototype = Widget.prototype;
						var props = {};
						for(var i in prototype){
							if(typeof prototype[i] != "function"){  
								(function(i){
									
									var callback = function(value){
										if(value !== undefined){
											if(props){
												props[i] = value;
											}else{
												widget.set(i, value);
											}
										}
									};
									if(i == "value"){
										self.parent.then(callback);
									}else{
										get(self.parent, i, callback);
									}
								})(i);
							}
						}
						var widgetContainer = element.makeGetValue('div').call(self);
						var widget = target.widget = new Widget(props, widgetContainer.appendChild(document.createElement('div')));
						props = null;
						callback(widgetContainer);
					});
				};
			}
		}
	}
});