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
  const skin=mats.get('DragonSkin');if(skin&&kit.details){skin.map=kit.details.scales;skin.bumpMap=kit.details.scales;skin.bumpScale=.006;skin.roughness=.5;skin.onBeforeCompile=shader=>{shader.uniforms.petMuzzle={value:new T.Color('#eedcb8')};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPetBind;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPetBind=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vPetBind; uniform vec3 petMuzzle;').replace('#include <color_fragment>','#include <color_fragment>\nfloat muzzle=smoothstep(.79,.98,vPetBind.z)*(1.-smoothstep(1.15,1.24,vPetBind.y))*smoothstep(1.06,1.16,vPetBind.y)*(1.-smoothstep(.25,.34,abs(vPetBind.x)));diffuseColor.rgb=mix(diffuseColor.rgb,petMuzzle,muzzle);');};skin.customProgramCacheKey=()=>'cover-muzzle-1';}
  const saddle=root.getObjectByName('DragonSaddle');saddle.geometry.computeBoundingBox();forms.push({name,root,bones,mats,features:[],element:null,saddle,seat:saddle.geometry.boundingBox.getCenter(new T.Vector3())});
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
 function setElement(form,element){if(form.element===element)return;form.element=element;const palette=DRAGON_FACE_PALETTES[element]||DRAGON_FACE_PALETTES.ember;form.mats.get('DragonSkin')?.color.set(palette.skin);form.mats.get('DragonMembrane')?.color.set(palette.wing);for(const feature of form.features)if(feature.iris)feature.mesh.material.color.set(palette.iris);
 }
 return {group,ready,getMountPoint(target=new T.Vector3()){group.updateMatrixWorld(true);if(!activeForm)return target.copy(group.position);target.copy(activeForm.seat);activeForm.saddle.applyBoneTransform(0,target);return activeForm.saddle.localToWorld(target);},animate(time,moving,riding,element,day=5,groundRace=false,motion={}){
  const dt=lastTime===null?0:Math.max(0,Math.min(.08,time-lastTime));lastTime=time;const blend=1-Math.exp(-Math.max(dt,.016)*16);const swimming=!!motion.swimming,speed=motion.speed??(moving?1.8:0);if(moving||swimming)gait+=dt*Math.min(3,1.1+speed*.65);const flying=riding&&!groundRace,airborne=flying||(motion.jump||0)>.02,mood=motion.mood||'look',sitting=mood==='sit'&&!moving&&!riding;
  for(const form of forms){form.root.visible=(form.name==='dragon-adult')===(day>=7);if(!form.root.visible)continue;activeForm=form;setElement(form,element);const {bones}=form;form.root.position.y=T.MathUtils.lerp(form.root.position.y,riding?0:sitting?-.10:moving?-.03:0,blend);form.root.rotation.x=T.MathUtils.lerp(form.root.rotation.x,flying?-.035:0,blend);
   for(let i=0;i<4;i++){const phase=(gait+(i===0||i===3?0:.5))%1,pose=dragonLegPose(sitting?.31:phase,i>=2,sitting);bonePose(bones[legs[i]+'Upper'],[swimming?-.18+Math.sin(phase*Math.PI*2)*.25:airborne?.4:moving||sitting?pose.hip:0,0,0],1-Math.exp(-Math.max(dt,.016)*24),true);bonePose(bones[legs[i]+'Lower'],[swimming?-.12+Math.sin(phase*Math.PI*2+.7)*.18:airborne?-.65:moving||sitting?pose.knee:0,0,0],1-Math.exp(-Math.max(dt,.016)*24),true);}
   for(const [i,name]of ['LeftWing','RightWing'].entries()){const sign=i?1:-1,beat=Math.sin(time*(day<7?7:5.8));bonePose(bones[name],[0,flying?0:sign*(swimming?1.45:1.0),(flying?beat*.55:.035)*sign],blend,true);bonePose(bones[name+'Tip'],[0,0,flying?Math.sin(time*(day<7?7:5.8)-.6)*.22*sign:sign*.28],blend,true);}
   for(let i=0;i<4;i++)bonePose(bones['Tail'+i],[0,(mood==='chase'?-.19:0)+Math.sin(time*(mood==='pant'?3:2)-i*.55)*(swimming?.16:flying?.045:.10),0],blend,true);
   const look=T.MathUtils.clamp(motion.lookYaw||0,-.55,.55);bonePose(bones.Neck,[Math.sin(time*1.5)*.012,look*.55,0],blend,true);bonePose(bones.Head,[sitting?-.04:Math.sin(time*1.2)*.012,look*.45+Math.sin(time*.65)*.035,0],blend,true);bonePose(bones.Jaw,[mood==='pant'?.035+Math.max(0,Math.sin(time*6))*.07:mood==='grin'?.018:.005,0,0],blend,true);bonePose(bones.Spine,[0,mood==='chase'?.07:0,0],blend,true);if(bones.Spine)bones.Spine.scale.y=riding?1:1+(mood==='pant'?Math.sin(time*6)*.008:Math.sin(time*1.6)*.003);
   const blink=(time+.4)%4.8,open=blink<.1?1-blink/.1:blink<.2?(blink-.1)/.1:1;const grin=T.MathUtils.clamp(motion.grin??(mood==='grin'?1:.25),0,1);for(const feature of form.features){if(feature.catchlight)feature.mesh.visible=open>.85;const target=feature.kind==='cover'?1-open:feature.kind==='eye'?Math.max(1-open,grin*.07):grin;feature.mesh.morphTargetInfluences[0]=T.MathUtils.lerp(feature.mesh.morphTargetInfluences[0],target,blend);}
   const saddle=form.root.getObjectByName('DragonSaddle');if(saddle)saddle.visible=riding;
  }
 },dispose(){disposed=true;forms.forEach(form=>disposeNurseryModel(form.root));}};
}
