# Dragon Adventures original 3D art

These static GLB assets are authored for this site by `tools/build-dragon-art.py` using Blender. They contain original geometry, materials and skin weights, with no external texture or mesh dependencies. The cover illustration is an art direction reference; no Nintendo models or animations are included.

Rebuild with Blender 5.x:

```sh
blender --background --factory-startup --python tools/build-dragon-art.py -- assets/dragon-adventures/models
```

The keeper has two articulated arms and legs. Both dragon forms have a fused body, four articulated legs, a weighted neck and tail, and two flexible membrane wings. Runtime poses blend in the local Three.js renderer. Buildings and furnishings use bevelled geometry; scenery is instanced and merged after loading.

The cottage exterior follows the Dragon Adventures cover: a front-facing slate roof, projecting gables, glowing arched windows and door, porch lanterns, ivy, wisteria and flower beds. Rebuild just that model with `--only-cottage` after the output directory argument. Its existing doorway and footprint are retained.

The current dragon source is `tools/build-dragon-companion.py`, called by `build-dragon-art.py`. It follows the user-approved generated image at `assets/dragon-adventures/three-babies-reference.png`: an upright rounded chest, tucked front paws, four rounded toes per paw, curved ivory horns, cheek fans, scalloped wings, cream belly scutes, and a curled tail. Both ages share this design; runtime growth makes the adult larger. Rebuild only these models with `--only-dragons` after the output directory.

The live pet renderer uses these complete rigged GLBs for walking, swimming, flying, care activities, and the sky race. `src/dragon-companion-surfaces.js` supplies fine scale relief, softer skin highlights and cheek coloration; `src/dragon-face-art.js` supplies the three reference palettes. Eyes, attached blinking lids, mouths, paws, horns, membranes and tail details are geometry. The green and red babies rest with closed smiles; the blue baby has a small open smile. All can pant.

`src/dragon-pet-behavior.js` controls following, circling, hopping, panting and tail chasing. Mounted characters attach to the actual skinned saddle; its rest height is 1.52 model units. The preview at `previews/dragon-cover-studio.html` renders the same game factory and includes all three babies, a growth comparison, close-up, walking, flight and rotation, plus the approved reference for comparison.

The keeper's skirts and coat hems are weighted to the hips and torso, sleeves use continuous shoulder weights, and the fused trousers use blended hip and knee weights. Dresses and coats have a connected `RidingDrape` morph for seated poses.

Pet posture is animated by `src/dragon-pet-pose.js`: the hips and chest blend between a seated pose and a four-paw standing pose, two-joint leg solves plant the ankles, and four separate `Foot` joints keep toes level. The tail curl is weighted exclusively to its own chain beyond the paws, with a ground-clearance pass. `src/dragon-pet-behavior.js` includes sit, stand and wag phases as well as following, circling, panting and hopping. The preview includes explicit Stand up, Sit down and Wag tail controls.
