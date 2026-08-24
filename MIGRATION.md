# Native-browser module resolution

No API migration is required for 2.0.2. The portable entry remains the bare package import:

```js
import Is from 'strong-type';
```

strong-type works with bundlers and without a bundler. Bundlers resolve the bare import normally. Native browser ESM needs an import map before the module script; no build, bundling, or transpilation step is required.

For the normal npm layout, place this complete map before the module that imports strong-type:

```html
<script type="importmap">
{
    "imports": {
        "strong-type": "./node_modules/strong-type/index.js"
    }
}
</script>

<script type="module">
    import Is from 'strong-type';
    console.log(new Is(false).string('native ESM'));
</script>
```

The mapped path is relative to the HTML document. Serve the app over HTTP(S), and configure the server to expose the mapped `node_modules` file. `file://` is not a supported module-loading path.

Do not replace the package import with a consumer-layout assumption such as `../strong-type/index.js`. strong-type has zero runtime dependencies, so this release needs no dependency entries or nested-version `scopes` block. The Node-only adapter remains `strong-type/node` and must not be imported by browser code.
