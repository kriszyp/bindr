define(['../dbind', 'put-selector/put', 'dojo/Stateful', '../Cascade'], function(dbind, put, Stateful, Cascade){
	var get = Cascade.get;
	var getComputedStyle = window.getComputedStyle;
	obj = Stateful({
			name: "Mike",
			age: 33
		});
	var target = get(dbind(put(document.body, 'div'), obj,
		'element: module(bindr/element); span: element(span); div: element(div); body: [span + source/name { color: green; };' + 
		'div + source/age { font-weight: bold}]'), function(target){
		console.assert(target.firstChild.tagName == 'SPAN');
		console.assert(target.firstChild.innerHTML == 'Mike');
		console.assert(getComputedStyle(target.firstChild).color == 'rgb(0, 128, 0)');
		console.assert(target.firstChild.nextSibling.tagName == 'DIV');
		console.assert(target.firstChild.nextSibling.innerHTML == '33');
		console.assert(getComputedStyle(target.firstChild.nextSibling).fontWeight == 'bold');
	});
	var target = get(dbind(put(document.body, 'div'), obj,
		'element: module(bindr/element); div: element(div); label: element(label); text-box: element(input,text); ' +
		'body: [div { ' +
			'person-label: label { color: green};' +
			'[person-label + "Name:",' +
			'text-box + source/name,' +
			'person-label + "Age:",' +
			'text-box + source/age {font-weight: bold;}]}]'), function(target){
				console.assert(target.innerHTML == '<div><label style="color: green; ">Name:</label><input type="text"><label style="color: green; ">Age:</label><input type="text" style="font-weight: bold; "></div>');
			});
});	