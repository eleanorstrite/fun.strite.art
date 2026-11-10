import * as T from './vendor/three/three.module.min.js';

// Keep the original palette and skinning while giving each surface its own response to light.
export function refineKeeperSurfaces(model,kit){
 const converted=new Map();
 model.traverse(object=>{if(!object.material)return;const refine=source=>{
  if(converted.has(source))return converted.get(source);
  if(!['KeeperCloth','KeeperTrousers','KeeperLinen','KeeperAccent','KeeperHair','KeeperSkin','KeeperFaceSkin','KeeperIris','KeeperLeather'].includes(source.name))return source;
  const material=new T.MeshPhysicalMaterial();T.MeshStandardMaterial.prototype.copy.call(material,source);material.name=source.name;
  if(/Cloth|Trousers|Linen|Accent/.test(source.name)){
   material.sheen=.38;material.sheenColor.set('#e1d7c6');material.sheenRoughness=.85;material.roughness=.82;
   if(kit.details?.fabric){material.bumpMap=kit.details.fabric;material.bumpScale=.0011;}
  }else if(source.name==='KeeperHair'){
   material.roughness=.43;material.anisotropy=.55;material.anisotropyRotation=Math.PI/2;
   if(kit.details?.hair){material.bumpMap=kit.details.hair;material.bumpScale=.00065;}
  }else if(source.name==='KeeperIris'){
   material.roughness=.21;material.clearcoat=.8;material.clearcoatRoughness=.12;
  }else if(source.name==='KeeperLeather'){
   material.roughness=.62;material.clearcoat=.12;material.clearcoatRoughness=.65;
  }else{material.roughness=.62;material.clearcoat=.08;material.clearcoatRoughness=.65;}
  converted.set(source,material);return material;
 };object.material=Array.isArray(object.material)?object.material.map(refine):refine(object.material);});
 for(const source of converted.keys())source.dispose();
}

// A small, local lighting environment supplies soft reflections on eyes, hair and buttons.
export function keeperLightEnvironment(renderer,scene){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');
 const sky=c.createLinearGradient(0,0,0,256);sky.addColorStop(0,'#a8bfd7');sky.addColorStop(.48,'#e2e8e5');sky.addColorStop(.55,'#9eaa8c');sky.addColorStop(1,'#4e5746');c.fillStyle=sky;c.fillRect(0,0,512,256);
 const light=c.createRadialGradient(125,70,2,125,70,95);light.addColorStop(0,'#fff6dc');light.addColorStop(.3,'#fff0c7');light.addColorStop(1,'#fff0c700');c.fillStyle=light;c.fillRect(20,0,220,180);
 const source=new T.CanvasTexture(canvas);source.colorSpace=T.SRGBColorSpace;source.mapping=T.EquirectangularReflectionMapping;const generator=new T.PMREMGenerator(renderer),target=generator.fromEquirectangular(source);scene.environment=target.texture;scene.environmentIntensity=.55;source.dispose();generator.dispose();
 return ()=>{scene.environment=null;target.dispose();};
}
