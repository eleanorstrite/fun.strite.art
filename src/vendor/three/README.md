Three.js 0.180.0, distributed under the MIT license in LICENSE.

Vendored from https://cdn.jsdelivr.net/npm/three@0.180.0/build/ so City Builder
works on GitHub Pages without a runtime CDN dependency. Game engines load the renderer only when needed. Preserve both module files together.

Dragon Adventures also vendors the matching 0.180.0 GLTFLoader and its
BufferGeometryUtils dependency under addons/. Their bare `three` imports are
changed to the local runtime. Original Three.js MIT license applies.
