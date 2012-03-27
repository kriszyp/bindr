/*
my-range: range + source/rating {
	min: 1;
	max: 10;
}
 */	

define(['./Cascade', 'dojo/_base/declare'], function(Cascade, declare){
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
					require(clazz, function(){
						Widget = arguments.length == 1 ? arguments[0] : declare([].slice.call(arguments,0), {});
						var prototype = Widget.prototype;
						var props = {};
						//TODO: fix "get" being in the prototype
						/*for(var i in prototype){
							(function(i){
								get(target, i, function(value){
									if(value !== undefined){
										if(props){
											props[i] = value;
										}else{
											widget.set(i, value);
										}
									}
								});
							})(i);
						}*/
						var widget = target.widget = new Widget(props);
						props = null;
						callback(widget.domNode);
					});
				};
			}
		}
	}
});