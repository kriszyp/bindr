define(['./Reactive', './Cascade', 'compose/compose'], function(Reactive, Cascade, Compose){
	return function(env){
		var get = Cascade.get;
		var resolve = Cascade.resolve;
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
		function reactiveFunction(target, func){
			target.override = function(target, args){
				target.getValue = function(callback){
					var resolvedArgs = [];
					var doneInit;
					for(var i = 0; i < args.length; i++){
						var arg = args[i];
						(function(arg, i){
							get(arg, function(value){
								resolvedArgs[i] = value;
								if(doneInit){
									// only call this asyncronously
									callback(func.apply(this, resolvedArgs));
								}
							});
						})(arg.splice ? resolve(target, arg) : arg, i);
					}
					doneInit = true;
					if(resolvedArgs.length){
						// some have resolved now at least, call the function
						callback(func.apply(this, resolvedArgs));
					}
				}
			};
		};
		reactiveFunction(get(env, 'or'), function(a, b){
			return a || b;
		});
		reactiveFunction(get(env, 'and'), function(a, b){
			return a && b;
		});
		reactiveFunction(get(env, 'add'), function(a, b){
			return a + b;
		});
	};
});