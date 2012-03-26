define(['./Cascade', './ReactiveObject', './env', './parser', './element'], function(Cascade, ReactiveObject, env, parser, element){
	var get = Cascade.get;
	var domContext = new Cascade;
	env(domContext);
	function dbind(element, data, sheet){
		var root = createRoot(element);
		if(data){
			root.source = new ReactiveObject(data);
		}
		parser({text: sheet}, root);
		return get(root, "-element");
	}
	function createRoot(domElement){
		var root = new Cascade;
		element.override(root, 'div');
		get(root, '-element').element = domElement;
		root.parent = domContext;
		root.isRoot = true;
		return root;
	}
	dbind.createRoot = createRoot;
	dbind.on = function(element, type, listener){
		element.addEventListener(type, listener, false);
	}
	return dbind;
});