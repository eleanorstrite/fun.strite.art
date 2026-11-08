# Dragon Adventures original 3D art

These static GLB assets are authored for this site by `tools/build-dragon-art.py` using Blender. They contain original geometry, materials and skin weights, with no external texture or mesh dependencies. The cover illustration is an art direction reference; no Nintendo models or animations are included.

Rebuild with Blender 5.x:

```sh
blender --background --factory-startup --python tools/build-dragon-art.py -- assets/dragon-adventures/models
```

The keeper has two articulated arms and legs. Both dragon forms have a fused body, four articulated legs, a weighted neck and tail, and two flexible membrane wings. Runtime poses blend in the local Three.js renderer. Buildings and furnishings use bevelled geometry; scenery is instanced and merged after loading.
