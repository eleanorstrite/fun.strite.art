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

export async function captureHairstyles(){
 const {KEEPER_HAIRSTYLES,keeperHairNode}=await import('../src/dragon-keeper-looks.js');
 const canvas=document.createElement('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(160,176,false);renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene(),kit=nurseryMaterials(),person=nurseryKeeper(scene,kit,{age:'adult',hair:'#533723'}),camera=new T.PerspectiveCamera(30,160/176,.05,20),disposeEnvironment=keeperLightEnvironment(renderer,scene),mannequin=new T.MeshStandardMaterial({color:'#d1cbbf',roughness:.85});
 scene.add(new T.HemisphereLight('#e7f0ff','#8b7964',1.7));const light=new T.DirectionalLight('#fff0d5',3);light.position.set(-2,4,4);scene.add(light);const fill=new T.DirectionalLight('#e2edff',1);fill.position.set(3,2,-1);scene.add(fill);
 try{await Promise.all([person.ready,kit.ready]);const captures=[];person.group.rotation.y=.5;
  for(const style of KEEPER_HAIRSTYLES){person.updateAppearance({age:'adult',hairStyle:style.id,hair:'#533723'});person.animate(0,false,false);person.group.updateMatrixWorld(true);const selected=person.group.getObjectByName(keeperHairNode(style.id)),hidden=[],bounds=new T.Box3().setFromObject(selected);
   person.group.traverse(mesh=>{if(!mesh.isMesh)return;let belongs=false;for(let p=mesh;p;p=p.parent)if(p===selected)belongs=true;const head=/^Keeper(?:Face|Ear)(?:[_.]?\d+)?$/.test(mesh.name);
    if(head){mesh.material=mannequin;bounds.union(new T.Box3().setFromObject(mesh));}else if(!belongs&&mesh.visible){hidden.push(mesh);mesh.visible=false;}
   });
   const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),height=Math.max(.42,size.y,size.x/(160/176))*1.22,distance=height/(2*Math.tan(Math.PI/12))+size.z*.5;camera.position.set(center.x+.015,center.y,center.z+distance);camera.lookAt(center);renderer.render(scene,camera);captures.push({id:style.id,data:canvas.toDataURL('image/png')});hidden.forEach(mesh=>mesh.visible=true);
  }return captures;
 }finally{disposeEnvironment();person.dispose();kit.dispose(scene);mannequin.dispose();renderer.dispose();}
}
