import * as T from './vendor/three/three.module.min.js';
import {bonePose} from './dragon-art-assets.js';
const clamp=T.MathUtils.clamp;
const names=['LFore','RFore','LHind','RHind'];
const v=()=>new T.Vector3(),q=()=>new T.Quaternion();

// The hips and chest change posture while a two-joint solve keeps each ankle grounded.
// Separate ankle bones let the toes remain level instead of rotating like rigid flippers.
export function createDragonPetPose(group,root,bones){
 group.updateMatrixWorld(true);
 const groupQ=group.getWorldQuaternion(q()),inverseQ=groupQ.clone().invert();
 const limbs=names.map((name,i)=>{
  const upper=bones[name+'Upper'],lower=bones[name+'Lower'],foot=bones[name+'Foot'];
  if(!upper||!lower||!foot)throw Error('Dragon leg is missing an articulated ankle: '+name);
  for(const bone of [upper,lower,foot])if(!bone.userData.bindQuaternion)bone.userData.bindQuaternion=bone.quaternion.clone();
  const rest=group.worldToLocal(foot.getWorldPosition(v()));
  return {name,upper,lower,foot,rest,upperQ:upper.quaternion.clone(),lowerQ:lower.quaternion.clone(),footQ:inverseQ.clone().multiply(foot.getWorldQuaternion(q())),pole:new T.Vector3(i%2? .45:-.45,0,-1),plant:null,swing:null,lastPhase:0,walking:false,target:null};
 });
 const body=root.getObjectByName(root.name==='baby-dragon'?'BabyDragonBody':'AdultDragonBody'),tail=bones.Tail0,tailSamples=[];
 const candidates=[],positions=body.geometry.attributes.position,indices=body.geometry.attributes.skinIndex,weights=body.geometry.attributes.skinWeight;
 for(let i=0;i<positions.count;i++){let weight=0;for(let j=0;j<4;j++)if(body.skeleton.bones[indices.getComponent(i,j)].name.startsWith('Tail'))weight+=weights.getComponent(i,j);if(weight>.65)candidates.push(i);}
 // Sample the underside of each part of the curl, plus a spread over its full surface.
 const underside=new Map();for(const i of candidates){const key=Math.floor(positions.getX(i)*12)+':'+Math.floor(positions.getZ(i)*12)+':'+indices.getX(i)+':'+indices.getY(i),old=underside.get(key);if(old===undefined||positions.getY(i)<positions.getY(old))underside.set(key,i);}tailSamples.push(...underside.values());
 const stride=Math.max(1,Math.floor(candidates.length/180));for(let i=0;i<candidates.length;i+=stride)tailSamples.push(candidates[i]);
 let sit=0,spinePitch=0,spineYaw=0,grounded=true,tailUncorrected=null,tailRoll=0;
 const worldPoint=(p)=>group.localToWorld(p.clone());
 function orient(bone,from,to){
  const current=bone.getWorldQuaternion(q()),delta=q().setFromUnitVectors(from.normalize(),to.normalize());
  const desired=delta.multiply(current),parent=bone.parent.getWorldQuaternion(q()).invert();bone.quaternion.copy(parent.multiply(desired));bone.updateWorldMatrix(false,true);
 }
 function solve(limb,target){
  const {upper,lower,foot}=limb;upper.quaternion.copy(limb.upperQ);lower.quaternion.copy(limb.lowerQ);upper.updateWorldMatrix(true,true);
  const hip=upper.getWorldPosition(v()),knee=lower.getWorldPosition(v()),ankle=foot.getWorldPosition(v()),a=hip.distanceTo(knee),b=knee.distanceTo(ankle),reach=a+b-.0005;
  // Keep the chosen ground height even if a fast runner needs a slightly shorter stride.
  const dy=hip.y-target.y,maxHorizontal=Math.sqrt(Math.max(.0001,reach*reach-dy*dy)),horizontal=Math.hypot(target.x-hip.x,target.z-hip.z);
  if(horizontal>maxHorizontal){const t=maxHorizontal/horizontal;target.x=hip.x+(target.x-hip.x)*t;target.z=hip.z+(target.z-hip.z)*t;}
  const direction=target.clone().sub(hip),distance=clamp(direction.length(),Math.abs(a-b)+.0005,reach);direction.normalize();
  const along=(a*a+distance*distance-b*b)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));
  const pole=limb.pole.clone().applyQuaternion(group.getWorldQuaternion(q()));pole.addScaledVector(direction,-pole.dot(direction));
  if(pole.lengthSq()<.001)pole.set(1,0,0);pole.normalize();
  const bend=hip.clone().addScaledVector(direction,along).addScaledVector(pole,height);
  orient(upper,knee.clone().sub(hip),bend.clone().sub(hip));
  const nextKnee=lower.getWorldPosition(v()),nextAnkle=foot.getWorldPosition(v());
  orient(lower,nextAnkle.sub(nextKnee),target.clone().sub(nextKnee));
  // Preserve the foot's rest orientation around the dragon's heading, independently of the knee.
  const heading=group.getWorldQuaternion(q()),forward=new T.Vector3(0,0,1).applyQuaternion(heading),yaw=Math.atan2(forward.x,forward.z);
  const desired=q().setFromAxisAngle(new T.Vector3(0,1,0),yaw).multiply(limb.footQ);
  foot.quaternion.copy(foot.parent.getWorldQuaternion(q()).invert().multiply(desired));foot.updateWorldMatrix(false,true);
 }
 return {
  get sit(){return sit;},get pitch(){return spinePitch;},
  body({sitting,ground,dt,yaw=0}){
   if(tailUncorrected)tail.quaternion.copy(tailUncorrected);grounded=ground;sit=T.MathUtils.lerp(sit,sitting?1:0,1-Math.exp(-dt*5));
   const lift=ground? .07-.18*sit:0,pitch=ground? .28-.44*sit:0;
   root.position.y=T.MathUtils.lerp(root.position.y,lift,1-Math.exp(-dt*8));
   spinePitch=T.MathUtils.lerp(spinePitch,pitch,1-Math.exp(-dt*8));spineYaw=T.MathUtils.lerp(spineYaw,yaw,1-Math.exp(-dt*8));bonePose(bones.Spine,[spinePitch,spineYaw,0],1,true);root.userData.petPosture=ground?(sit>.8?'sitting':sit<.2?'standing':'changing posture'):'airborne';
   root.updateWorldMatrix(true,true);
  },
  tail(){
   tailUncorrected=tail.quaternion.clone();if(!grounded){tailRoll=0;return;}
   const axis=new T.Vector3(0,0,1).applyQuaternion(group.getWorldQuaternion(q())),ground=group.getWorldPosition(v()).y,scale=Math.abs(group.getWorldScale(v()).y);
   const apply=angle=>{tail.quaternion.copy(tailUncorrected);tail.updateWorldMatrix(true,true);const world=tail.getWorldQuaternion(q()),rotation=q().setFromAxisAngle(axis,angle).multiply(world);tail.quaternion.copy(tail.parent.getWorldQuaternion(q()).invert().multiply(rotation));tail.updateWorldMatrix(false,true);};
   tailRoll=Math.max(0,tailRoll-.003);apply(tailRoll);
   for(let pass=0;pass<3;pass++){
    let minimum=Infinity;const point=v();for(const i of tailSamples){body.getVertexPosition(i,point);body.localToWorld(point);minimum=Math.min(minimum,point.y-ground);}
    if(minimum>=.025*scale)break;
    tailRoll=clamp(tailRoll+(.035*scale-minimum)/Math.max(.3,scale),0,.6);apply(tailRoll);
   }
  },
  feet({gait,moving,speed,frequency,dt,inPlace=false}){
   if(!grounded){for(const limb of limbs){limb.plant=limb.swing=limb.target=null;limb.walking=false;}return;}
   const worldScale=group.getWorldScale(v()),scale=Math.abs(worldScale.y),groundY=group.getWorldPosition(v()).y;
   const forward=new T.Vector3(0,0,1).applyQuaternion(group.getWorldQuaternion(q()));forward.y=0;forward.normalize();
   for(let i=0;i<limbs.length;i++){
    const limb=limbs[i],phase=(gait+(i===0||i===3?0:.5))%1,stance=.62,stride=i<2?.36:.42;
    const rest=limb.rest.clone();rest.z-=moving?(i<2?.12:.06):0;
    const anchor=worldPoint(rest);anchor.y=groundY+limb.rest.y*scale;let target;
    if(!moving){
     limb.walking=false;limb.plant=null;limb.swing=null;
     target=limb.target?limb.target.clone().lerp(anchor,1-Math.exp(-dt*14)):anchor;
    }else if(inPlace){
     const t=Math.max(0,(phase-stance)/(1-stance)),ease=t*t*(3-2*t);rest.z+=phase<stance?stride*(.5-phase/stance):stride*(ease-.5);target=worldPoint(rest);target.y=anchor.y+(phase<stance?0:Math.sin(t*Math.PI)*.105*scale);limb.walking=false;
    }else if(phase<stance){
     if(!limb.walking||limb.lastPhase>=stance||phase<limb.lastPhase){const foot=worldPoint(rest.clone().add(new T.Vector3(0,0,stride*.5)));foot.y=anchor.y;limb.plant=foot;}
     target=limb.plant.clone();limb.swing=null;limb.walking=true;
    }else{
     if(!limb.walking||!limb.swing)limb.swing=limb.target?.clone()||anchor.clone();
     const t=(phase-stance)/(1-stance),ease=t*t*(3-2*t),landing=worldPoint(rest.clone().add(new T.Vector3(0,0,stride*.5)));
     landing.addScaledVector(forward,Math.max(0,speed)*(1-phase)/Math.max(1,frequency));landing.y=anchor.y;
     target=limb.swing.clone().lerp(landing,ease);target.y=anchor.y+Math.sin(t*Math.PI)*.105*scale;limb.walking=true;
    }
    limb.lastPhase=phase;limb.target=target.clone();solve(limb,target);
   }
  }
 };
}
