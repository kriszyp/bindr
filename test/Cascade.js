define(['../Cascade', '../Reactive'], function(Cascade, Reactive){
	
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
	base2: {
		inherited: 10; 
	}
	instance: base, base2 {
		foo: 4;
		make something-new: Number, 3;
	}*/
	var top = new Cascade;
	var get = Cascade.get;
	var addBase = Cascade.addBase;
	get(get(top, "base"), "foo").is(3);
	top.get("base").get("inherited").is(6);
	var bound = top.get("base").get("bound");
	bound.addRef(['foo']);
	var instance = top.get("instance");
	instance.addRef(['base']);
	addBase(instance,{foo:4});
	
	var thens = 0;
	top.get("base").get("foo", function(value){
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