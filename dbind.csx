x-bindr {}
element: module(bindr/element);
scroll: element(div.bindr-scroll) {
	overflow: auto;
};
button: element(button);
table: element(table);
label: element(label);
form: element(div.form);
text-box: element(input,text);
password: element(input,password);
date: element(input,date);
span: element(span);
div: element(div);
li: element(li);
ul: element(ul);
full-layout: {
	[
		top: pane {
			bottom: auto;
		},
		left: pane {
			right: auto;
		},
		center: pane {
			top: top/height;
			bottom: bottom/height;
			left: left/height;
			left: right/height;
		},
		right: pane {
			left: auto;
		},
		bottom: pane {
			top: auto;
		}
	]
	pane: {
		position: absolute;
		left: 0px;
		right: 0px;
		top: 0px;
		bottom: 0px;
	}
	position: relative;
} 