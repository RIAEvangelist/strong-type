# strong-type

Type checking module for anywhere javascript can run ES6 modules. This includes node, electron and the browsers.

`strong-type` allows easy type enforcement for all JS types objects and classes. it is also extensible and provides simple to use type checks for your own custom classes and types should you want to use them.

Documentation coming soon.

install
`npm i strong-type`

check the examples
run `npm i` in the root dir to make sure you get the devDependencies installed.

node example
`npm run nodeExample`

browser example
`npm start`
then go to `http://localhost:8000/example/web/index.html`

Chrome, Opera, and Edge support all the types so all rows will be green

You will see some red rows in Firefox as it does not yet support all types. The unsupported types will throw type errors when checked/validated.