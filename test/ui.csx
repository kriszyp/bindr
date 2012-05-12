@import "../dbind.csx";
person-label: @import "person-label.csx" {}

.rounded {
	border-width: 1px; 
	border-style: solid;
	border-color: #333;
	border-radius: 5px;
};
editable-source: transaction(source);
title: source/name;
body [
	form [
		label "Name:" .rounded,
		text-box or(editable-source/name, "None"),
		label "Price:",
		text-box editable-source/price {
			font-weight: bold;
			color: blue;
		},
		button "Save" {
			onclick: editable-source/save;
		},
		ul source/options {
			each: li [
				label item/name,
				select item/choices [
					each: option item
				]
			]
		}
	],
	div [
		span editable-source/price,
		div "Expando" {
			background-color: red;
			height: 20px;
			width: editable-source/price;
		}
	]
]