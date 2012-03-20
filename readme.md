(This project is still in early development and is only partly functional)
Bindr is simple, secure, layerable, declarative, aspect-oriented, functionally reactive language for defining a transformation
of data. Bindr is designed to easily bind inputs to outputs such that one can create an
representative output of time-varying inputs. This is particularly useful for developing
user interfaces where visual elements can be bound to data inputs such data changes
can automatically be reflected in UI updates, and user modifications flow back to data.

You may want to see the dbind package for full user interface development with bindr.
This package provides a bindr implementation with basic generic constructs. However, 
if you are developing applications with a user interface, you probably want a full UI
binding implementation. The dbind package provides a full library of DOM entities and widgets for
building web/HTML based applications, based on the Dojo toolkit.

Bindr bears similarities to CSS, but it is generic transform, applicable to any data
structure, and it features the composition and referencing capabilities that facilitate
full virtually limitless possibilities of design, not just annotative styling. Bindr also has similar
syntax, and the nested object referencing has similiarities with selector semantics. In
fact bindr definitions can coexist with CSS, which is useful in web based applications.

JSON is also a proper subset of Bindr. This means that it works easily with common 
data interchange and combined with the secure nature of Bindr, JSON can be safely 
and properly parsed with a Bindr parser. 

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

Multiple target references can be included, plus-sign delimited, and these will be mixed 
in to the created object, with the last having precedence. For example:

	new-object: base + mixin { my-property: 3 }

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

	new-object: base + mixin { 
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

	@import 'base.br';

The 'base.br' file will be imported, behaving as if it was copied and pasted into the calling module,
making all the property definitions from 'base.br' be included in our module.

We can also @import within sub value definitions. For example we could assign the definitions
from 'base.br' to the 'base' property rather than importing all the definitions at the top level:

	base: @import 'base.br';

@import statements can exist with object definitions or children definitions as well.

## @extends directive 

The @extends directive allows you to define a mixin from with an object definition. For
example, these are equivalent:

	obj1: base;

and:
	
	obj1: {
		@extends base;
	}

  
## Keywords

Bindr has a few 
### this

### parent

## Alternate Syntax

