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
	get(top, "base", "foo").is(3);
	get(top,"base", "inherited").is(6);
	var bound = get(top, "base", "bound");
	bound.addRef(['foo']);
	var instance = get(top, "instance");
	instance.addRef(['base']);
	addBase(instance,{foo:4});
	
	var thens = 0;
	get(top, "base", "foo", function(value){
		thens++;
		console.assert(value == 3);
	});
	get(top, "instance", "foo", function(value){
		thens++;
		console.assert(value == 4);
	});
	get(top, "instance", "inherited", function(value){
		thens++;
		console.assert(value == 6);
	});
	get(top, "instance", "bound", function(value){
		thens++;
		console.assert(value == 4);
	});
	console.assert(thens == 4);
});