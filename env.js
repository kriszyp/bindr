define(['./Reactive', './Cascade', 'compose/compose'], function(Reactive, Cascade, Compose){
	return function(env){
		var get = Cascade.get;
		var moduleBase = get(env, 'module');
		moduleBase.override = function(target, args){
			if(args){
				return {
					then: function(callback){
						require([args[0].join('/')], function(module){
							if(module.call){
								module.call(moduleBase, target);
							}else{
								for(var i in module){
									target[i] = module[i];
								}
							}
							callback();
						});
					}
				};
			}
		};
		get(env, 'or').override = function(target, args){
			target.getValue = function(callback){
				return "hi"
			}
		};
	};
});