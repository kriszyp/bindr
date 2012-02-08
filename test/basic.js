define(['../dbind', 'put-selector/put'], function(dbind, put){
	var getComputedStyle = window.getComputedStyle;
	var target = dbind(put(document.body, 'div'), {
			name: "Mike",
			age: 33
		},
		'[span+source/name { color: green; };' + // span { content: from name} span { source: parent.source.name}
		'div+source/age { font-weight: bold}]').then(function(target){
		console.assert(target.firstChild.tagName == 'SPAN');
		console.assert(target.firstChild.innerHTML == 'Mike');
		console.assert(getComputedStyle(target.firstChild).color == 'rgb(0, 128, 0)');
		console.assert(target.firstChild.nextSibling.tagName == 'DIV');
		console.assert(target.firstChild.nextSibling.innerHTML == '33');
		console.assert(getComputedStyle(target.firstChild.nextSibling).fontWeight == 'bold');
	});
	var target = dbind(put(document.body, 'div'), {
			name: "Mike",
			age: 33
		},
		'[div { ' +
			'person-label: label { color: green};' +
			'[person-label {content: "Name:"};' +
			'text { content: source/name};' +
			'person-label {content: "Repeated Name:"};' +
			'text { content: source/name; font-weight: bold;};]}]').then(function(target){
				console.log(target.innerHTML);
			});
});