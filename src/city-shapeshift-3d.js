import {CITY_ANIMALS,CITY_ANIMAL_MOVEMENT} from './city-powers.js';
export const CITY_ANIMAL_ART=Object.fromEntries(CITY_ANIMALS.map(kind=>[kind,`./assets/animals/${kind}.png`]));
// The four photographic views follow the viewer, not just the animal's heading.
export function cityAnimalView(heading,cameraAzimuth){
 const angle=Math.atan2(Math.sin(cameraAzimuth-heading),Math.cos(cameraAzimuth-heading));
 if(Math.abs(angle)<Math.PI/4)return 0;if(Math.abs(angle)>Math.PI*3/4)return 2;return angle>0?3:1;
}
// Generated side profiles are wider than front/rear views; keep their original proportions.
const COLUMNS={tiger:[0,.18,.53,.67,1],cat:[0,.19,.53,.68,1],dog:[0,.19,.53,.68,1],giraffe:[0,.25,.5,.75,1],elephant:[0,.195,.525,.69,1],dragon:[0,.195,.507,.69,1]};
function framesFor(kind,image){
 const width=image.width,height=image.height,frames=[];let pixels;
 if(typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);pixels=ctx.getImageData(0,0,width,height).data;}
 for(let row=0;row<2;row++)for(let col=0;col<4;col++){
  let x0=Math.floor(COLUMNS[kind][col]*width),x1=Math.floor(COLUMNS[kind][col+1]*width);const y0=Math.floor(row*height/2),y1=Math.floor((row+1)*height/2);if(kind==='dragon'&&col===0)x1=Math.floor(.19*width);
  // Ignore fragments from a neighbouring pose at the edge of an uneven sheet cell.
  if(pixels){let start=x0,last=x0-1,bestStart=x0,bestEnd=x0-1;
   for(let x=x0;x<x1;x++){let count=0;for(let y=y0;y<y1;y++)if(pixels[(y*width+x)*4+3]>140)count++;
    if(count>3){if(x-last>4)start=x;last=x;if(last-start>bestEnd-bestStart){bestStart=start;bestEnd=last;}}
   }
   if(bestEnd>bestStart){x0=bestStart;x1=bestEnd+1;}
  }
  let left=x1,right=x0,top=y1,bottom=y0;
  if(pixels)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){if(pixels[(y*width+x)*4+3]>140){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
  if(right<=left||bottom<=top){left=x0;right=x1-1;top=y0;bottom=y1-1;}
  frames.push({x:(left+.5)/width,y:1-(bottom+.5)/height,w:(right-left)/width,h:(bottom-top)/height,pixelWidth:right-left,pixelHeight:bottom-top});
 }
 return frames;
}
export function createCityShapeshift(T,scene,material,geo,camera=null,{loadTexture=(url,ready,failed)=>new T.TextureLoader().load(url,ready,undefined,failed)}={}){
 const root=new T.Group();root.name='city-shapeshift';root.visible=false;scene.add(root);
 const models=new Map(),ownedTextures=new Set(),ownedMaterials=new Set();let time=0,destroyed=false,lastPosition=null,lastKind=null;
 const sizes={tiger:2.1,cat:1.25,dog:1.85,giraffe:3.6,elephant:2.8,dragon:3};
 const geometry=geo('photographic-animal-plane',()=>new T.PlaneGeometry(1,1,8,12).translate(0,.5,0));
 const basePositions=geometry.attributes.position.array.slice();
 function build(kind){
  const group=new T.Group();group.name='shapeshift-'+kind;group.userData.animal=kind;root.add(group);
  const model={group,ready:false,failed:false,poses:[],activity:0,phase:0};models.set(kind,model);
  const shadow=new T.Mesh(geo('photographic-animal-shadow',()=>new T.CircleGeometry(.4,40)),material('photographic-animal-shadow',{color:'#15231a',transparent:true,opacity:.2,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;shadow.scale.set(kind==='elephant'?1.5:1,kind==='giraffe'?.8:1,1);group.add(shadow);
  loadTexture(CITY_ANIMAL_ART[kind],sheet=>{
   if(destroyed){sheet.dispose();return;}ownedTextures.add(sheet);sheet.colorSpace=T.SRGBColorSpace;model.frames=framesFor(kind,sheet.image);model.pixelScale=sizes[kind]/Math.max(...model.frames.map(f=>f.pixelHeight));
   for(let row=0;row<2;row++){
    const map=sheet.clone();map.repeat.set(.25,.5);map.offset.set(0,.5-row*.5);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.needsUpdate=true;ownedTextures.add(map);
    const mat=new T.MeshBasicMaterial({map,transparent:true,alphaTest:.025,depthWrite:false,side:T.DoubleSide,toneMapped:false});ownedMaterials.add(mat);
    const plane=new T.Mesh(geometry,mat);plane.name=row?'animal-walking-photograph':'animal-standing-photograph';plane.scale.setScalar(sizes[kind]);plane.renderOrder=row+1;group.add(plane);model.poses.push(plane);
   }
   model.ready=true;
  },()=>{model.failed=true;});return model;
 }
 function render({mode,player,powers={},moving,interior,fire,dt}){
  time+=Math.max(0,dt||0);const active=mode==='walk'&&!interior&&!fire&&powers.shapeshift>0&&CITY_ANIMALS.includes(powers.animal);
  if(!active){root.visible=false;lastPosition=null;lastKind=null;return false;}
  const kind=powers.animal,model=models.get(kind)??build(kind);for(const [name,m]of models)m.group.visible=name===kind;
  // Keep the normal character visible until the chosen photograph is fully loaded.
  root.visible=model.ready;if(!model.ready)return false;
  root.position.set(player.x,.025+(player.altitude||0),player.z);
  const azimuth=camera?Math.atan2(camera.position.x-player.x,camera.position.z-player.z):0,column=cityAnimalView(player.angle||0,azimuth);
  model.group.rotation.y=azimuth;model.group.userData.view=column;
  const seconds=Math.max(0,dt||0),distance=lastPosition&&lastKind===kind?Math.hypot(player.x-lastPosition.x,player.z-lastPosition.z):0;
  lastPosition={x:player.x,z:player.z};lastKind=kind;
  // Strides follow ground covered: walls, pauses and standing still cannot run the feet.
  if(seconds>0&&moving&&distance<2)model.phase+=distance/CITY_ANIMAL_MOVEMENT[kind].stride*Math.PI*2;
  model.activity+=(Number(Boolean(moving))-model.activity)*(1-Math.exp(-seconds*12));
  const cycle=Math.sin(model.phase),walking=model.activity>.25&&cycle>0;
  // A small continuous bend through the torso and legs softens each photographic pose.
  // The sole line stays grounded, and only one photograph is ever visible.
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){const x=basePositions[i*3],y=basePositions[i*3+1],weight=Math.sin(y*Math.PI);
   positions.setXYZ(i,x+Math.sin(model.phase+y*2)*.014*weight*model.activity,y+Math.sin(model.phase*2)*.008*y*model.activity,0);
  }positions.needsUpdate=true;
  model.poses.forEach((plane,row)=>{const frame=model.frames[row*4+column];plane.material.map.offset.set(frame.x,frame.y);plane.material.map.repeat.set(frame.w,frame.h);plane.material.opacity=1;plane.visible=row===Number(walking);plane.position.y=0;plane.scale.set(frame.pixelWidth*model.pixelScale,frame.pixelHeight*model.pixelScale*(1+Math.sin(time*1.7)*.002),1);});return true;
 }
 return {render,dispose(){destroyed=true;for(const map of ownedTextures)map.dispose();for(const mat of ownedMaterials)mat.dispose();root.removeFromParent();}};
}
