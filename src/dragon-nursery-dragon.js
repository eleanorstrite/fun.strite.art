import {createDragonPetPose} from './dragon-pet-pose.js';
import {refineCompanionSurfaces} from './dragon-companion-surfaces.js';
import * as T from './vendor/three/three.module.min.js';
import {loadNurseryModel,prepareNurseryModel,modelMaterials,bonePose,disposeNurseryModel} from './dragon-art-assets.js';
import {DRAGON_FACE_PALETTES} from './dragon-face-art.js';

export function dragonLegPose(phase,rear=false,sitting=false){
 const stance=.62,stride=rear?.24:.18;let z,lift;
 if(phase<stance){z=stride*(.5-phase/stance);lift=0;}else{const u=(phase-stance)/(1-stance),ease=u*u*(3-2*u);z=stride*(ease-.5);lift=Math.sin(u*Math.PI)*.085;}
 const a=Math.hypot(.27,.12),b=Math.hypot(.345,rear?.685:.445),dy=(sitting?.50:.585)-lift,dz=.565+z,d=Math.min(a+b-.002,Math.hypot(dy,dz)),beta=Math.atan2(dz,dy),alpha=Math.acos(T.MathUtils.clamp((a*a+d*d-b*b)/(2*a*d),-1,1)),gamma=Math.acos(T.MathUtils.clamp((b*b+d*d-a*a)/(2*b*d),-1,1)),hip=beta-alpha,lower=beta+gamma,restHip=Math.atan2(rear?-.12:.12,.27),restKnee=Math.atan2(rear?.685:.445,.345)-restHip;
 return {hip:-(hip-restHip),knee:-((lower-hip)-restKnee)};
}
export function nurseryDragon(parent,kit={}){
 const group=new T.Group();group.name='rigged-cover-dragon';parent.add(group);const forms=[],legs=['LFore','RFore','LHind','RHind'];let disposed=false,lastTime=null,gait=0,activeForm=null;
 const ready=Promise.all(['dragon-baby','dragon-adult'].map(async name=>{
  const asset=await(kit.loadModel||loadNurseryModel)(name),root=prepareNurseryModel(asset.scene),bones={};if(disposed){disposeNurseryModel(root);return;}root.name=name==='dragon-baby'?'baby-dragon':'adult-dragon';root.traverse(o=>{if(o.isBone)bones[o.name]=o;});const mats=modelMaterials(root);group.add(root);root.visible=false;
  refineCompanionSurfaces(root,kit,mats);
  const saddle=root.getObjectByName('DragonSaddle');saddle.geometry.computeBoundingBox();forms.push({name,root,bones,mats,features:[],element:null,saddle,posture:createDragonPetPose(group,root,bones),seat:saddle.geometry.boundingBox.getCenter(new T.Vector3())});
 })).then(()=>{if(disposed)return;
  for(const form of forms)form.element=null;
  for(const form of forms){
   form.root.updateMatrixWorld(true);const anchors=[];
   form.root.traverse(mesh=>{if(!mesh.isMesh||! /^(?:Baby|Adult)Eye(?:[_.]?\d+)?$/.test(mesh.name))return;mesh.geometry.computeBoundingBox();anchors.push(mesh.localToWorld(mesh.geometry.boundingBox.getCenter(new T.Vector3())));});
   form.root.traverse(mesh=>{if(mesh.isMesh&&/^(RelaxedEyeHood|GentleUpperLid)/.test(mesh.name)){form.features.push({mesh,kind:'cover'});return;}const mouth=mesh.name.startsWith('DragonHappyMouth');if(!mesh.isMesh||!mouth&&! /^(?:Baby|Adult)(?:Eye|Iris|Pupil|Catchlight)(?:[_.]?\d+)?$/.test(mesh.name))return;
    mesh.geometry=mesh.geometry.clone();mesh.geometry.computeBoundingBox();const bounds=mesh.geometry.boundingBox,size=bounds.getSize(new T.Vector3()),position=mesh.geometry.attributes.position,center=bounds.getCenter(new T.Vector3()),target=position.clone();
    const worldCenter=mesh.localToWorld(center.clone()),anchor=anchors.slice().sort((a,b)=>a.distanceToSquared(worldCenter)-b.distanceToSquared(worldCenter))[0],lidCenter=anchor?mesh.worldToLocal(anchor.clone()).y:center.y;
    if(/^(?:Baby|Adult)Eye/.test(mesh.name)){mesh.material=mesh.material.clone();mesh.material.color.set('#fff2db');}
    if(/Iris|Pupil/.test(mesh.name)){
     mesh.material=new T.MeshPhysicalMaterial({name:mesh.material.name,color:mesh.material.color,roughness:.18,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.1});
     if(/Iris/.test(mesh.name)){mesh.material.onBeforeCompile=shader=>{shader.uniforms.eyeCenter={value:center};shader.uniforms.eyeSize={value:size};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform vec3 eyeCenter;uniform vec3 eyeSize;varying vec2 petIrisUv;').replace('#include <begin_vertex>','#include <begin_vertex>\npetIrisUv=(position.xy-eyeCenter.xy)/eyeSize.xy*2.;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 petIrisUv;').replace('#include <color_fragment>',`#include <color_fragment>
      float r=length(petIrisUv);float fibers=sin(atan(petIrisUv.y,petIrisUv.x)*92.+r*24.)*.07;
      diffuseColor.rgb*=mix(1.15,.28,smoothstep(.58,1.,r))+fibers;
     `);};mesh.material.customProgramCacheKey=()=>'sculpted-warm-dragon-iris-1';}
    }
    if(mouth)mesh.material.side=T.DoubleSide;
    for(let i=0;i<target.count;i++){const x=position.getX(i)-center.x,y=position.getY(i)-center.y;if(mouth){target.setX(i,center.x+x*1.025);target.setY(i,center.y+y*.94+Math.pow(x/(size.x*.5),2)*.003);}else target.setY(i,lidCenter+(position.getY(i)-lidCenter)*.045);}
    mesh.geometry.morphAttributes.position=[target];mesh.updateMorphTargets();form.features.push({mesh,kind:mouth?'mouth':'eye',iris:/Iris/.test(mesh.name),catchlight:/Catchlight/.test(mesh.name)});
   });
  }
 });
 function setElement(form,element){if(form.element===element)return;form.element=element;const palette=DRAGON_FACE_PALETTES[element]||DRAGON_FACE_PALETTES.ember;form.mats.get('DragonSkin')?.color.set(palette.skin);form.mats.get('DragonMembrane')?.color.set(palette.wing);form.mats.get('DragonBrow')?.color.set(palette.brow);for(const feature of form.features)if(feature.iris)feature.mesh.material.color.set(palette.iris);
 }
 return {group,ready,getMountPoint(target=new T.Vector3()){group.updateMatrixWorld(true);if(!activeForm)return target.copy(group.position);target.copy(activeForm.seat);activeForm.saddle.applyBoneTransform(0,target);return activeForm.saddle.localToWorld(target);},animate(time,moving,riding,element,day=5,groundRace=false,motion={}){
  const dt=lastTime===null?0:Math.max(0,Math.min(.08,time-lastTime));lastTime=time;const blend=1-Math.exp(-Math.max(dt,.016)*16);const swimming=!!motion.swimming,speed=motion.speed??(moving?1.8:0);const scale=Math.max(.3,group.getWorldScale(new T.Vector3()).y),frequency=T.MathUtils.clamp(Math.max(.2,speed)*.62/(.38*scale),1.3,9);if(moving||swimming)gait+=dt*frequency;const flying=riding&&!groundRace,airborne=flying||(motion.jump||0)>.02,mood=motion.mood||'look',sitting=mood==='sit'&&!moving&&!riding;
  for(const form of forms){form.root.visible=(form.name==='dragon-adult')===(day>=7);if(!form.root.visible)continue;activeForm=form;setElement(form,element);const closedSmile=element!=='river'&&mood!=='pant';for(const name of ['DragonSmileCover','DragonSmileCrease']){const part=form.root.getObjectByName(name);if(part)part.visible=closedSmile;}for(const name of ['DragonHappyMouth','DragonTongue']){const part=form.root.getObjectByName(name);if(part)part.visible=!closedSmile;}form.root.traverse(o=>{if(o.name.startsWith('DragonMilkTooth'))o.visible=!closedSmile;});const {bones,posture}=form;posture.body({sitting,ground:!swimming&&!airborne,dt:Math.max(dt,.016),yaw:mood==='chase'?.07:0});form.root.rotation.x=T.MathUtils.lerp(form.root.rotation.x,flying?-.035:0,blend);
   if(swimming||airborne)for(let i=0;i<4;i++){const phase=(gait+(i===0||i===3?0:.5))%1;bonePose(bones[legs[i]+'Upper'],[swimming?-.18+Math.sin(phase*Math.PI*2)*.25:.4,0,0],blend,true);bonePose(bones[legs[i]+'Lower'],[swimming?-.12+Math.sin(phase*Math.PI*2+.7)*.18:-.65,0,0],blend,true);bonePose(bones[legs[i]+'Foot'],[swimming?Math.sin(phase*Math.PI*2)*.12:-.18,0,0],blend,true);}
   posture.feet({gait,moving:!!moving&&!sitting,speed,frequency,dt:Math.max(dt,.016),inPlace:!!motion.inPlace});
   for(const [i,name]of ['LeftWing','RightWing'].entries()){const sign=i?1:-1,beat=Math.sin(time*(day<7?7:5.8));bonePose(bones[name],[0,flying?0:sign*(swimming?1.25:.65),(flying?beat*.55:.035)*sign],blend,true);bonePose(bones[name+'Tip'],[0,0,flying?Math.sin(time*(day<7?7:5.8)-.6)*.22*sign:sign*.10],blend,true);}
   // A traveling wag moves the whole tail chain; sitting adds a lift so its curl rests beside the hips.
   for(let i=0;i<4;i++){const active=mood==='chase'||mood==='circle'||mood==='wag',wave=time*(active?3.8:1.7)-i*.8,amplitude=swimming?.19:flying?.07:(.10+i*.045)*(active?1.4:1);
    bonePose(bones['Tail'+i],[i===0?posture.sit*.10+Math.sin(wave*.8)*.025:Math.sin(wave)*.045,(active?-.14:0)+Math.sin(wave)*amplitude,i===0?posture.sit*.17+Math.sin(wave*.7)*.018:Math.sin(wave*.8)*.025],1-Math.exp(-Math.max(dt,.016)*7),true);
   }
   const look=T.MathUtils.clamp(motion.lookYaw||0,-.55,.55);bonePose(bones.Neck,[-posture.pitch*.60+Math.sin(time*1.5)*.012,look*.55,0],blend,true);bonePose(bones.Head,[-posture.pitch*.35+(sitting?-.04:Math.sin(time*1.2)*.012),look*.45+Math.sin(time*.65)*.035,!moving&&!riding?Math.sin(time*.8)*.035:0],blend,true);bonePose(bones.Jaw,[mood==='pant'?.035+Math.max(0,Math.sin(time*6))*.07:mood==='grin'?.018:.005,0,0],blend,true);if(bones.Spine)bones.Spine.scale.y=riding?1:1+(mood==='pant'?Math.sin(time*6)*.008:Math.sin(time*1.6)*.003);
   const blink=(time+.4)%4.8,open=blink<.1?1-blink/.1:blink<.2?(blink-.1)/.1:1;const grin=T.MathUtils.clamp(motion.grin??(mood==='grin'?1:.25),0,1);for(const feature of form.features){if(feature.catchlight)feature.mesh.visible=open>.85;const target=feature.kind==='cover'?1-open:feature.kind==='eye'?Math.max(1-open,grin*.07):grin;feature.mesh.morphTargetInfluences[0]=T.MathUtils.lerp(feature.mesh.morphTargetInfluences[0],target,blend);}
   const saddle=form.root.getObjectByName('DragonSaddle');if(saddle)saddle.visible=riding;group.updateMatrixWorld(true);posture.tail();
  }
 },dispose(){disposed=true;forms.forEach(form=>disposeNurseryModel(form.root));}};
}
