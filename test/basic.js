define(['../dbind', 'put-selector/put', 'dojo/Stateful'], function(dbind, put, Stateful){
	var getComputedStyle = window.getComputedStyle;
	obj = Stateful({
			name: "Mike",
			age: 33
		});
	var target = dbind(put(document.body, 'div'), obj,
		'[span + source/name { color: green; };' + 
		'div + source/age { font-weight: bold}]').then(function(target){
		console.assert(target.firstChild.tagName == 'SPAN');
		console.assert(target.firstChild.innerHTML == 'Mike');
		console.assert(getComputedStyle(target.firstChild).color == 'rgb(0, 128, 0)');
		console.assert(target.firstChild.nextSibling.tagName == 'DIV');
		console.assert(target.firstChild.nextSibling.innerHTML == '33');
		console.assert(getComputedStyle(target.firstChild.nextSibling).fontWeight == 'bold');
	});
	var target = dbind(put(document.body, 'div'), obj,
		'[div { ' +
			'person-label: label { color: green};' +
			'[person-label + "Name:",' +
			'text + source/name,' +
			'person-label + "Age:",' +
			'text + source/age {font-weight: bold;}]}]').then(function(target){
				console.assert(target.innerHTML == '<div><label style="color: green; ">Name:</label><input type="text"><label style="color: green; ">Age:</label><input type="text" style="font-weight: bold; "></div>');
			});
});	