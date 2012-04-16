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
		var body = get(root, 'body');
		element.apply(body, ['div']);
		get(body, '-element').element = domElement;
		root.parent = domContext;
		root.isRoot = true;
		return root;
	}
	dbind.createRoot = createRoot;
	return dbind;
});