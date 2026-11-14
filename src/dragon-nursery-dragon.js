import * as T from './vendor/three/three.module.min.js';
import {DRAGON_COVER_IMAGE,DRAGON_COVER_PETS} from './dragon-cover-parts.js';

export function coverDragonGeometry(outline,pivot,unit){
 const shape=new T.Shape(outline.map(([x,y])=>new T.Vector2((x-pivot[0])*unit,(pivot[1]-y)*unit))),geometry=new T.ShapeGeometry(shape),position=geometry.attributes.position,uv=geometry.attributes.uv;
 for(let i=0;i<position.count;i++)uv.setXY(i,(position.getX(i)/unit+pivot[0])/1280,1-(pivot[1]-position.getY(i)/unit)/720);
 return geometry;
}
export function nurseryDragon(parent,kit={}){
 const group=new T.Group();group.name='home-art-dragon';group.userData.artSource=DRAGON_COVER_IMAGE;parent.add(group);const forms=[],geometries=[],materials=[];let texture,disposed=false,roll=0;
 const billboard=new T.Group();group.add(billboard);const cameraQ=new T.Quaternion(),parentQ=new T.Quaternion(),rollQ=new T.Quaternion(),axis=new T.Vector3(0,0,1);
 function faceCamera(renderer,scene,camera){camera.getWorldQuaternion(cameraQ);group.getWorldQuaternion(parentQ);billboard.quaternion.copy(parentQ.invert()).multiply(cameraQ).multiply(rollQ.setFromAxisAngle(axis,roll));billboard.updateWorldMatrix(false,true);}
 const shadowMaterial=new T.MeshBasicMaterial({color:'#203321',transparent:true,opacity:.15,depthWrite:false});materials.push(shadowMaterial);const shadowGeometry=new T.CircleGeometry(.8,40);geometries.push(shadowGeometry);const shadow=new T.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.scale.y=.48;shadow.position.y=.025;group.add(shadow);
 const ready=Promise.resolve().then(()=>kit.loadCoverArt?kit.loadCoverArt(DRAGON_COVER_IMAGE):new T.TextureLoader().loadAsync(DRAGON_COVER_IMAGE)).then(map=>{
  texture=map;if(disposed){map.dispose();return;}map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  const material=new T.MeshBasicMaterial({map,transparent:true,side:T.DoubleSide,depthWrite:false,toneMapped:false});materials.push(material);
  for(const [element,art]of Object.entries(DRAGON_COVER_PETS)){
   const root=new T.Group();root.name=element+'-cover-dragon';root.visible=false;billboard.add(root);const unit=2.4/(art.baseline-art.top),parts=[];
   art.parts.forEach((part,index)=>{const pivot=new T.Group();pivot.name=part.id;pivot.position.set((part.pivot[0]-art.anchor)*unit,(art.baseline-part.pivot[1])*unit,index*.001);root.add(pivot);const geometry=coverDragonGeometry(part.outline,part.pivot,unit);geometries.push(geometry);const mesh=new T.Mesh(geometry,material);mesh.name=part.id+'-original-pixels';mesh.onBeforeRender=faceCamera;pivot.add(mesh);parts.push({pivot,kind:part.kind,rest:pivot.position.clone(),index});});forms.push({element,root,parts});
  }
 });
 return {group,ready,animate(time,moving,riding,element,day=5,groundRace=false){
  const flying=riding&&!groundRace,pace=time*(groundRace?12:7),selected=DRAGON_COVER_PETS[element]?element:'ember';group.userData.stage=day>=7?'adult':'baby';shadow.visible=!flying;roll=flying?Math.sin(time*2)*.018:0;
  for(const form of forms){form.root.visible=form.element===selected;if(!form.root.visible)continue;form.root.position.y=flying?Math.sin(time*3)*.045:moving?Math.abs(Math.sin(pace))*.025:Math.sin(time*1.8)*.009;
   for(const part of form.parts){const p=part.pivot;p.position.copy(part.rest);p.rotation.set(0,0,0);p.scale.set(1,1,1);const sign=part.index%2?1:-1;
    if(part.kind==='wing'){p.rotation.z=sign*(flying?Math.sin(time*7)*.08:Math.sin(time*1.5)*.008);p.scale.y=flying?.91+Math.sin(time*7)*.09:1;}
    if(part.kind==='tail')p.rotation.z=Math.sin(time*2)*.025;
    if(part.kind==='paw'&&moving&&!flying){const step=Math.sin(pace+sign*Math.PI/2);p.position.y+=Math.max(0,step)*.045;p.rotation.z=step*.045;}
    if(part.kind==='face')p.rotation.z=Math.sin(time*1.3)*.006;
   }
  }
 },dispose(){disposed=true;for(const g of geometries)g.dispose();for(const m of materials)m.dispose();texture?.dispose();}};
}
