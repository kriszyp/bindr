define(['./Reactive', './Cascade', 'compose/compose'], function(Reactive, Cascade, Compose){
	return function(env){
		var cascade = Compose.create(Cascade, {
			then: function(callback){
				var a, b;
				this.get(0).then(function(value){
					a = value;
					callback(a || b);
				});
				this.get(1).then(function(value){
					b = value;
					callback(a || b);
				});
			}
		});
		env['or-'] = cascade;
	};
});