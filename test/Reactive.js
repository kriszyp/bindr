define(['../Reactive'], function(Reactive){
	
	/*
	top: {
		a: 1; 
	}
	base: {
		foo: String, 3;
		inherited: 6;
		bound: foo;
		li {
			color: green; 
		}
		make something-new: 2;
	}
	instance: base {
		foo: 4;
		make something-new: Number, 3;
	}*/
	var top = new Reactive;
	top.get("base").get("foo").is(3);
	top.get("base").get("inherited").is(6);
	top.get("base").get("bound").extend("foo");
	var instance = top.get("instance");
	instance.extend("base");
	instance.get("foo").is(4);
	
	var thens = 0;
	top.get("base").get("foo").then(function(value){
		thens++;
		console.assert(value == 3);
	});
	top.get("instance").get("foo").then(function(value){
		thens++;
		console.assert(value == 4);
	});
	top.get("instance").get("inherited").then(function(value){
		thens++;
		console.assert(value == 6);
	});
	top.get("instance").get("bound").then(function(value){
		thens++;
		console.assert(value == 4);
	});
	console.assert(thens == 4);
});