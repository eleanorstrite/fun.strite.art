// In the local preview browser: import('/tools/capture-dragon-wardrobe.mjs'),
// then call captureWardrobe() and write its returned PNG data URLs to the wardrobe directory.
import * as T from '../src/vendor/three/three.module.min.js';
import {nurseryMaterials} from '../src/dragon-nursery-materials.js';
import {nurseryKeeper} from '../src/dragon-nursery-models.js';
import {KEEPER_OUTFITS,KEEPER_OUTFIT_PALETTES,keeperOutfitNode} from '../src/dragon-keeper-looks.js';
import {keeperLightEnvironment} from '../src/dragon-keeper-surface.js';
export async function captureWardrobe(){
 const canvas=document.createElement('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(288,368,false);renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene(),kit=nurseryMaterials(),person=nurseryKeeper(scene,kit,{age:'adult'}),camera=new T.PerspectiveCamera(32,288/368,.05,20),disposeEnvironment=keeperLightEnvironment(renderer,scene);
 scene.add(new T.HemisphereLight('#e7f0ff','#8b7964',1.7));const light=new T.DirectionalLight('#fff0d5',3);light.position.set(-2,4,4);scene.add(light);const fill=new T.DirectionalLight('#e2edff',1);fill.position.set(3,2,1);scene.add(fill);camera.position.set(.08,.88,3.05);camera.lookAt(0,.84,0);
 try{await Promise.all([person.ready,kit.ready]);const captures=[];
  for(const outfit of KEEPER_OUTFITS){person.updateAppearance({age:'adult',outfit:outfit.id,...KEEPER_OUTFIT_PALETTES[outfit.id]});person.animate(0,false,false);const selected=person.group.getObjectByName(keeperOutfitNode(outfit.id));const hidden=[];person.group.traverse(mesh=>{if(!mesh.isMesh)return;let belongs=false;for(let p=mesh;p;p=p.parent)if(p===selected)belongs=true;if(!belongs&&mesh.visible){hidden.push(mesh);mesh.visible=false;}});renderer.render(scene,camera);captures.push({id:outfit.id,data:canvas.toDataURL('image/png')});hidden.forEach(mesh=>mesh.visible=true);}
  return captures;
 }finally{disposeEnvironment();person.dispose();kit.dispose(scene);renderer.dispose();}
}
