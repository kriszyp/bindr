define(['../dbind', 'put-selector/put'], function(dbind, put){
	var getComputedStyle = window.getComputedStyle;
	var target = dbind(put(document.body, 'div'), {
			name: "Mike",
			age: 33
		},
		'[span { content: source/name; color: green; };' + // span { content: from name} span { source: parent.source.name}
		'div { content: source/age; font-weight: bold}]').then(function(target){
		console.assert(target.firstChild.tagName == 'SPAN');
		console.assert(target.firstChild.innerHTML == 'Mike');
		console.assert(getComputedStyle(target.firstChild).color == 'rgb(0, 128, 0)');
		console.assert(target.firstChild.nextSibling.tagName == 'DIV');
		console.assert(target.firstChild.nextSibling.innerHTML == '33');
		console.assert(getComputedStyle(target.firstChild.nextSibling).fontWeight == 'bold');
	});
/*	var target = put(document.body, 'div');
	castrans(
		'/ => form { ' +
			'person-label: label { color: rgb(from seniority,255,255)};' +
			'person-label "Person:";' +
			'/name <=> text {};' +
			'person-label "Gender:"' +
			'/gender <=> select { schema/gender => options}' +
			'person-label "Age:"' +
			'/age <=> number {}' +
		'background-color: #eee}')({
			name: "Mike",
			age: 33
		}).renderTo(target);
	var form = target.firstChild;
	console.assert(form.tagName, 'form');
	console.assert(getComputedStyle(target.firstChild).backgroundColor, '#eeeeee');
	console.assert(form.firstChild.tagName, 'label');
	console.assert(form.firstChild.innerText, 'Name:');
	console.assert(form.firstChild.nextSibling.tagName, 'input');
	console.assert(form.firstChild.nextSibling.type, 'text');
	console.assert(form.firstChild.nextSibling.nextSibiling.tagName, 'select');*/

});