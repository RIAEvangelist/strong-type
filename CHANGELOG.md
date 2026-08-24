# Changelog

## 2.0.2 — 2026-08-23

- Added one host-neutral behavioral inventory that executes unchanged in Node and real Google Chrome.
- Added explicit package and Chrome import-map metadata for the shared native `index.js` implementation.
- Added packed-consumer, dependency-tree, static deployment, and real-browser conformance gates.
- Clarified that strong-type works with bundlers and without a bundler. Bundlers resolve its bare package import normally; native browser ESM resolves that same import through an import map without a build or transpilation step.
- Documented the complete npm-layout import map before its module script. Map paths are relative to the HTML document; serve them over HTTP(S), expose the mapped files from the server, and do not use `file://`.

There are no runtime dependencies in 2.0.2, so nested dependency scopes and packed dependency-conflict tests are not applicable.
