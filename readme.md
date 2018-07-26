# Steven Says

`Steven Says` is a program for running queries against the transcripts of episodes of the Cartoon Network show "Steven Universe".

## Setup

In order to use `Steven Says`, you need to have nodejs installed. Checkout this repository and run:

```
npm install
```

so the project can load its dependencies

## Queries

`Steven Says` has a simple, lisp-like, build-in query language. To use it, run:

```
npm run query
```

You will be promted to enter a query. Confim it with enter. After it shows you the result, you can enter another query. Enter "exit" to stop. Alternatively, if you just want to one query, you can use.

```
npm run query "{{Query}}"
```

(where {{Query}} is the specific query you wrote)

But this can be make it more difficult to use string expressions.

The language consists of simple, nested expressions. These are surrounded by parentesis, start with the type of expression and end in a list of arguments. Example:

```
(and (word 'Clod) (not (speaker 'Peridot)))
```

will show all instances in which the word "Clod" is used by someone else then Peridot.

Other then expressions the following literals are supported:
* Strings are pieces of text surrounded by double quotes. They can be used to pass text to expressions
  * `(text "I can't")` matches any dialog that contains "I can't".
  * If you want to use quotes inside strings, you can mask them using a backslash character:
    * `(text "\"Why\"")` matches any dialog containing "Why" in quotes.
* Words are a shorter version of strings. They are started with a single quote, and end at spaces, parentesis and quotes.
  * `(text 'Test)` matches any dialog that contains "Test".
* Integers are just numbers. Decimals are not supported.
  * `(season 3)` matches any dialog in season 3.

The following expressions are supported:

* `word`: Matches if a given whole word is contained in the dialog.
  * Example: `(word 'tea)` matches any dialog that contains "tea", but not e.g. "instead".
* `text`: Matches if a given text is contained in the dialog.
  * Example: `(text 'tea)` matches any dialog that contains "tea", including e.g. "instead".
* `speaker`: Matches if a dialog is spoken by specific person.
  * Example: `(speaker 'Pearl)` matches any dialog spoken by Pearl.
* `season`: Matches if the dialog is spoken in a specific season.
  * Example: `(season 4)` matches any dialog in season 4.
* `and`: Matches if all given sub expressions match.
  * Example: `(and (speaker 'Pearl) (season 4))` matches any dialog spoken by Pearl in season 4.
* `or`: Matches if all given sub expressions match.
  * Example: `(or (speaker 'Pearl) (season 4))` matches any dialog spoken by Pearl, or by anyone in season 4.
* `not`: Matches if the given sub expressions does not match.
  * Example: `(not (season 4))` matches any dialog in any other season then 4.

To simplify queries, there are 3 shortcuts:
* The outer parentesis are not needed required.
  * `(and (text 'test) (word 'dodge))` can also be written as `and (text 'test) (word 'dodge)`
* If an expression is not given a name, `and` will be implied:
  *  `and (text 'test) (word 'dodge)` can also be written as `(text 'test) (word 'dodge)`
* If a string is directly used an `and`, `or` or `not` expression, it will automatically be treated as a `text` expression:
  * `(text 'test) (word 'dodge)` can also written as `'test (word 'dodge)`

## Data initialization
The repository already includes pre-initialized data, but if you need to update it. (E.g. when a new episode is released)

You can update the data using:

```
npm run init-data
```
