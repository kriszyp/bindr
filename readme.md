(This project is still in early development and is only partly functional, see tests for
examples that may be working and working to some degree)
Bindr is simple, secure, layerable, declarative, functionally reactive language for defining a transformation
of data. Bindr is designed to easily bind inputs to outputs such that one can create an
representative output of time-varying inputs. This is particularly useful for developing
user interfaces where visual elements can be bound to data inputs such data changes
can automatically be reflected in UI updates, and user modifications flow back to data.

The Bindr language is useful for many situations, this package specifically includes library
functions for building browser-based web UIs, making it easy to quickly create beautiful and 
maintainable front ends. Here is an example of how bindr can be used to create an 
interface. Here we utilize element generation, data bindings, CSS properties, and event
handlers:

	body [									/* generate elements as children of the body */
		h1 source/title {					/* generate an <h1>, bound to the title property of the source data*/
			font-weight: normal;			/* Set the font-weight to normal for the <h1>*/
		},
		div source/description,				/* Display the description property of the source data in a <div>*/
		form [								/* create a form */
			label.required 'Quantity', 	 /* Create a <label> with a class 'required' and text 'Quantity'*/
			text-box: quantity,				/* create an input text box, bound to the 'quantity' variable*/
			div 'Total Cost: ' + 
				(quantity * source/price),  /* Output total cost, bound to quantity and price*/
			button 'Order' {		/* create an button with 'Order' label*/
				onclick: +form/submit;  	/* when the button is clicked, submit the form*/
			}
		]
    ]
    quantity: 0;							/* define quantity variable
	.required {								/* Define a class using standard CSS syntax
    	color: red;
    }
	
Bindr bears similarities to CSS, but it is generic transform, applicable to any data
structure, and it features composition and referencing capabilities that facilitate
virtually unlimited possibilities of design, not just annotative styling. Bindr also has similar
syntax, and the nested object referencing has similarities with selector semantics. In
fact bindr definitions can coexist with CSS, which is useful in web based applications.

JSON is also a proper subset of Bindr. This means that it works easily with common 
data interchange and combined with the secure nature of Bindr, JSON can be safely 
and properly parsed with a Bindr parser. 

Bindr is not designed to completely supplant imperative programming. It is intended to
help minimize imperative code, isolating it to specific components and functions that
can be used within application design, where much of the application exists at a declarative
level with a clean separation from the imperative implementation details.

# Getting Started

We can start using Bindr by loading it on a page, and using it like CSS to style our page.
We will start with a simple variable definition, by defining the "my-color" variable to "#ddf"
and using it in a class definition: 

	<!DOCTYPE html>
	<html>
		<style>
			my-color: #ddf;
			.colored-text {
				color: my-color;
			}
		</style>
		<script src="/path/to/bindr.js"></script>
		<body class="colored-text">
		</body>
	</html>

We can actually have our content defined with bindr syntax directly in page. For example,
we could create a page to display a product. We will start with the content, providing
a minimal HTML header that allows the browser to bootstrap the bindr script and interpret
itself as bindr content. We will include a style element that indicates the user interface
file to use (you will note that we use .csx as a file extension for our bindr style sheetsheets):

	<!DOCTYPE html><script src="../bindr.js" data-bindr="page"></script>
	<style>@import "ui.csx";</style> /* <-- This indicates the sheet to use to render our content */
	/* Now begins our product object definition, defined with bindr syntax*/
	name: 'Shoes';
	description: 
		'The content of this page should be both valid bindr as well as valid HTML. This means it can be directly served up in a browser, and can be indexed by search engines.';
	price: 49.99;

Now we can define ui.csx to render this product object. The content from page is 
available in a variable named "source". For example, we could simply render the title
as in an &lt;h1> element and the description in a &lt;div> inside the body:

	body [
		h1 source/title,
		div source/description
	]

The advantage of using a bindr page as a starting point is that your site can be entirely
written in bindr (you could use a JSON serializer, since JSON is valid bindr, and just add 
the HTML preamble to bootstrap the library) and the site is still search engine accessible.

# Bindr UI Basics

When building UIs, Bindr can be used like CSS, with a selector and a set of properties
defining styles for the selector:

	label {
		color: red;
	}

With Bindr we can also define new entities, not only HTML elements:
  
	required-label: { ... }
	
And we can also inherit from or mixin other definitions. For example, we could define
our "required-label" to inherit from "label", but we will define "required-label" to be bold:

	required-label: label {
		font-weight: bold;	
	}

We could combine multiple definitions with this style of mixins:

	blue-text: {
		color: blue;
	}
	orange-background {
		background-color: orange;
	}
	/* required-label will be defined to be bold, blue text, and an orange background */
	required-label: label blue-text orange-background { 
		font-weight: bold;	
	}

## Element Generation
In bindr, not only can we define entities by style properties, but we can actually generate
elements, allowing us to define the visual presentation of an entity using multiple elements.
The syntax for generating children elements is enclose the children elements inside [] brackets.
For example, we could create a form-property that would combine extend a standard &lt;div>
and generate a &lt;label> and an &lt;input> when referenced:
  
	form-property: div [label, input]

We can combine our definitions to compose more complex components. We can also
combine a elements with plain text to fill the content of an element:

	my-form: form [
		label 'First Property',
		input 'default value'
	]

The my-form would then generate HTML like:

	<form>
		<label>First Property</label>
		<input value="default value" />
	</form>

We can also reference other sources of data by combining elements with raw data. We can
reference nested properties by delimiting with slashes. For example:

	source: {
		name: "Bill"
	}
	my-form: form [
		label 'Name',
		input source/name
	]

And the input value will be bound to the "name" property of the "source".

Again, with Bindr these data bindings are "live". Changes to the value of the source's 
name property (possibly from another widget) will automatically update the input's value
and user modification to the input will trigger a change to the source's name property. 

We can also generate elements when we combine entities that are have different essential
tags (and therefore can't be mixins). A second element reference will be treated as a
child element. For example, we could create a full table:

	full-table: table [
		tr td 'first row',
		tr td 'second row'
	]

And we can further reference defined entities. Here let's define the body of our
document with the elements above:

	my-form: form [
		required-label 'Name', /* reference required-label, which is a <label> with bold text */
		input source/name /* bind to the source's name */
	]
 
	body [ /* define the children of the body */
		h1 'My page with a form!', /* a header */
		my-form
	]

## Event Handling

We can also define event handlers in the properties for an entity. This is done by providing
a handler in a event handler property name. The event handler property names are the
same in Bindr as in JavaScript. For example:

	save-button {
		onclick: data.save
	}

However, we typically want to set event handlers in a way that does not replaces existing
handlers, but adds a new handler. In Bindr, using the plus operator with a function adds
it as a function that will execute after the original. For example, we could independently define two
handlers for the save-button such that the previous handler is not replaced:

	save-button {
		onclick: +data.save
	}
	...
	save-button {
		onclick: +save-button.disable
	}

## Widget Instantiation

More complex JavaScript-based widgets can also be declared in a consistent way. Here
we import the Dijit sheet that will instantiate Dijit widgets (when native components
are not available), which makes a set of widget entities available. Here we use the 
<code>range-input</code> (a HorizontalSlider from Dijit), and date-input (a DateTextBox from Dijit)
within a form: 

	@import 'bindr/dijit.csx';
	
	form [
		range-input source/number {
			minimum: 0;
			maximum: 10;
		},
		date-input source/date
	]

(Note this functionality is planned to be moved to it's own package dbind).

# Bindr Language Syntax and Semantics

A symbol is a token of letters and number (like valid variable names in JavaScript) that 
references an assigned property or variable in the current object, or any of the 
containing objects. The current object's properties has precedent over the parent 
object(s). The symbol binds to the property that it references, so if the property 
changes, the value of the symbol changes as well.

A symbol followed by a colon, followed by a value assigns the value to the given property in the current object. Assignment should end with a semi-colon. Note that JSS document is an object itself, so at the top level no {} brackets are need to start an object, top level assignments immediately assign to the root object. For example:

	foo: 3;

The foo property of the current object will now be 3. We can use a symbol as the value as well:

	bar: foo;

The foo symbol will resolve to the foo property assigned 3, so bar will have the value of 3 as well.

We can use curly brackets ({}) to assign a set of properties to the property's value. We could assign an object to the 'bar' property:

	bar: {
		foo: 3;
	}

We can create string values by quoting them:

	bar: {
		greeting: 'Hello World';
	}

We can also use a slash operator to reference properties of an object. Properties are also bound, the value changes as the property changes in the future:

	three: bar/foo;

Object can also be defined as an extension of another object. If a symbol refers to an object, an instance or derivative of that object will be created and then extended with the properties in the curly braces. For example:

	sub-bar: bar {
		bar: 4;
	}

The 'sub-bar' object will now effectively have the properties foo of 3 and bar of 4. 
Note that the inherited properties are not part of the scope, and symbol lookup will 
only find properties defined explicitly.

Multiple target references can be included, space delimited, and these will be combined 
in the referencing object. The . For example:

	new-object: base mixin { my-property: 3 }

Anytime we are defining mixins or properties of a value, it is always additive, we are 
modifying the existing value. For example, we 
could add a foo property and change the my-property to 4 to new-object by writing:

	new-object: { 
		foo: 'Bar';
		my-property: 3;
	}

Which would be the same as:

	new-object: { 
		foo: 'Bar';
	}
	new-object: {
		my-property: 3;
	}

We can also inherit from an existing object definition in the parent scope by simply 
omitting the colon. If we use this form in a child object that references a property from a parent object, 
an new instance of that object will be created as variable in the child object that 
inherits from the parent object's version. For example, if obj1 was defined without 
a colon in obj2:

	obj1: {
		bar: 4;
	}
	obj2: {
		obj1 {
			foo: 3;
		}
	}
	obj2/obj1/foo -> 3
	obj2/obj1/bar -> 4
	obj1/foo -> undefined

Note that this syntax can be regarded as sugar, a variable declaration with the name and value being the same:

	obj {...}

is the same as:

	obj: obj {...}

## Children

Values can also have children, which are an ordered set of values. Children of the value
are defined by using the square brackets ([]). For example, we can define that new-object has
two children: 

	new-object [
		obj1;
		obj2;
	]

Note that having children and having properties (and mixins) are not mutually exclusive.
We can define both:

	new-object: base mixin { 
		my-property: 3 
	}
	[
		obj1;
		obj2;
	]

## @import directive

Bindr allows you to reference or import other Bindr modules. To use the @import directive,
type "@import" followed by a string indicating the name of the file to import. For example,
we could add @import at the top level:

	@import 'base.csx';

The 'base.csx' file will be imported, behaving as if it was copied and pasted into the calling module,
making all the property definitions from 'base.br' be included in our module.

## url(path)

We can use url(path) within sub value definitions. For example we could assign the definitions
from 'base.csx' to the 'base' property rather than importing all the definitions at the top level:

	base: url(base.csx);

@import statements can exist with object definitions or children definitions as well.

## 'this' keyword 

The 'this' keyword allows you to reference the current object. You can use this to reference
to an inherited property value. For example, we could have a base object:

	base: {
		four: 4;
	}
	
we could reference the "four" property for this object (inherited from base):
	
	instance: base {
		another-four: this/four;
	}
	
We can use this to define a mixin from with an object definition. For
example, these are equivalent:

	obj1: base;

and:
	
	obj1: {
		this: base;
	}

  
## Keywords

### parent


## Alternate Syntax


You may want to see the dbind package for full user interface development with bindr.
This package provides a bindr implementation with basic generic constructs. However, 
if you are developing applications with a user interface, you probably want a full UI
binding implementation. The dbind package provides a full library of DOM entities and widgets for
building web/HTML based applications, based on the Dojo toolkit.

