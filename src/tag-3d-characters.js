import * as T from './vendor/three/three.module.min.js';
export function tag3DLimbKind(look){return look.accessory==='wings'?'wings':look.animal==='dragon'?'claws':look.animal==='person'?'hands':'paws';}
function mesh(parent,geometry,material,x=0,y=0,z=0){const object=new T.Mesh(geometry,material);object.position.set(x,y,z);parent.add(object);return object;}
function ball(parent,material,x,y,z,rx,ry=rx,rz=rx){const o=mesh(parent,new T.SphereGeometry(1,16,12),material,x,y,z);o.scale.set(rx,ry,rz);return o;}
function rod(parent,material,a,b,r=.04){const v=new T.Vector3(...a),w=new T.Vector3(...b),o=mesh(parent,new T.CylinderGeometry(r,r,v.distanceTo(w),10),material);o.position.copy(v).lerp(w,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.sub(v).normalize());return o;}
const mat=(color,roughness=.7)=>new T.MeshStandardMaterial({color,roughness});
export function createTag3DHands(camera,look){const group=new T.Group();group.name='First-person '+tag3DLimbKind(look);camera.add(group);const kind=tag3DLimbKind(look),skin=mat(look.animal==='person'?'#e8b895':look.color),cloth=mat(look.color),nail=mat('#fff0d0'),pad=mat(look.animal==='cat'?'#d893a1':'#6e5460'),arms=[];
 for(const side of [-1,1]){const root=new T.Group();root.position.set(side*.25,-.31,-.57);group.add(root);const fingers=[];if(kind==='wings'){
  const shape=new T.Shape();shape.moveTo(0,-.07);shape.lineTo(side*.10,.24);shape.lineTo(side*.40,.13);shape.quadraticCurveTo(side*.26,.04,side*.34,-.06);shape.quadraticCurveTo(side*.16,-.01,side*.18,-.17);shape.lineTo(0,-.07);const membrane=mesh(root,new T.ShapeGeometry(shape,16),new T.MeshStandardMaterial({color:look.color,side:T.DoubleSide,roughness:.65}));membrane.position.z=-.04;for(const point of [[side*.10,.24,-.04],[side*.40,.13,-.04],[side*.34,-.06,-.04],[side*.18,-.17,-.04]])rod(root,nail,[0,-.07,-.04],point,.012);ball(root,skin,0,-.07,0,.045);}
  else{rod(root,cloth,[0,-.15,.34],[0,-.06,.15],.075);rod(root,skin,[0,-.06,.15],[0,.02,0],.059);const cuff=mesh(root,new T.TorusGeometry(.07,.012,7,18),cloth,0,-.055,.15);cuff.rotation.x=.4;
   ball(root,skin,0,.02,0,kind==='hands'?.075:.09,.09,.045);
   if(kind==='hands'){for(let i=0;i<5;i++){const joint=new T.Group();joint.position.set(i===0?-side*.085:(i-2.5)*.035,i===0?.035:.09,-.005);joint.rotation.z=i===0?side*.8:0;root.add(joint);ball(joint,skin,0,.045,0,.016,.052,.017);fingers.push(joint);}}
   else{ball(root,pad,0,.015,.045,.043,.04,.009);for(let i=0;i<3;i++){const joint=new T.Group();joint.position.set((i-1)*.058,.085,0);root.add(joint);ball(joint,skin,0,.02,0,.035,.043,.04);if(kind==='claws'){const claw=mesh(joint,new T.ConeGeometry(.015,.065,8),nail,0,.059,-.02);claw.rotation.x=-.6;}else ball(joint,pad,0,.028,.037,.018,.022,.007);fingers.push(joint);}}
   if(look.outfit==='stripes')for(let j=0;j<3;j++)rod(root,nail,[-.06,-.13+j*.027,.29-j*.045],[.06,-.13+j*.027,.29-j*.045],.008);
  }arms.push({root,fingers,side});
 }
 return {group,kind,animate(p,time,reduced=false){const action=p.action?.type,phase=action==='climb'?(p.action.progress||0)*Math.PI*18:time*7,walk=action?0:Math.min(1,p.speed/6),blend=.25;for(const {root,fingers,side} of arms){let x=side*.25,y=-.31,z=-.57,rx=-.05,rz=side*.08,curl=.15;
   if(action==='climb'){const lift=Math.sin(phase+(side>0?Math.PI:0));x=side*.24;y=-.12+lift*.17;z=-.53-lift*.07;rx=.1;curl=.95-Math.max(0,lift)*.4;}
   else if(action==='slide'){x=side*.35;y=.04+Math.sin(time*8+side)*.045;z=-.65;rx=-.35;rz=side*(.25+Math.sin(time*6)*.12);curl=.03;}
   else if(action==='swing'){x=side*.34;y=.03;z=-.53;curl=.9;rx=.2;}
   else{y+=(reduced?0:Math.sin(phase+side)*.025*walk);z+=Math.sin(phase+side)*.035*walk;}
   if(kind==='wings'){x*=.8;y-=.06;rz+=side*Math.sin(phase)*.12*(action?1:walk);}
   root.position.lerp(new T.Vector3(x,y,z),blend);root.rotation.x=T.MathUtils.lerp(root.rotation.x,rx,blend);root.rotation.z=T.MathUtils.lerp(root.rotation.z,rz,blend);for(const finger of fingers)finger.rotation.x=T.MathUtils.lerp(finger.rotation.x,-curl,blend);
  }}};
}
export function createTag3DAvatar(parent,look){const group=new T.Group();parent.add(group);const skin=mat(look.animal==='person'?'#e8b895':look.color),shirt=mat(look.color),dark=mat('#263745'),white=mat('#fff3df'),iris=mat('#294750'),limbs=[],wings=[];
 const body=mesh(group,new T.CapsuleGeometry(.25,.40,5,14),shirt,0,1.0,0),head=ball(group,skin,0,1.65,.02,.25,.27,.23);rod(group,skin,[0,1.23,0],[0,1.48,0],.10);
 for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.14,.78,0);group.add(leg);rod(leg,dark,[0,0,0],[0,-.65,0],.08);ball(leg,dark,0,-.68,.07,.11,.07,.18);const arm=new T.Group();arm.position.set(side*.27,1.25,0);group.add(arm);rod(arm,shirt,[0,0,0],[side*.05,-.38,0],.075);ball(arm,skin,side*.05,-.43,0,.075,.10,.07);limbs.push({arm,leg,side});
  ball(group,white,side*.085,1.7,.225,.06,.074,.025);ball(group,iris,side*.085,1.7,.25,.031,.044,.014);ball(group,white,side*.095,1.72,.263,.012);
  if(look.animal==='cat'){const ear=mesh(group,new T.ConeGeometry(.09,.22,4),skin,side*.19,1.91,.02);ear.rotation.z=-side*.2;}
  if(look.animal==='dog')ball(group,dark,side*.23,1.63,0,.095,.20,.09);
  if(look.animal==='dragon'){const horn=mesh(group,new T.ConeGeometry(.065,.22,9),white,side*.17,1.92,-.04);horn.rotation.z=-side*.2;}
  if(look.animal==='dragon'||look.accessory==='wings'){const wing=new T.Group();wing.position.set(side*.19,1.2,-.14);group.add(wing);const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(side*.27,.55);shape.lineTo(side*.75,.2);shape.lineTo(side*.45,-.10);shape.lineTo(0,0);mesh(wing,new T.ShapeGeometry(shape),new T.MeshStandardMaterial({color:look.color,side:T.DoubleSide}));wings.push({wing,side});}
 }
 if(look.animal!=='person'){ball(group,white,0,1.55,.23,.14,.075,.09);const curve=new T.CatmullRomCurve3([new T.Vector3(0,.85,-.12),new T.Vector3(.2,.8,-.45),new T.Vector3(.32,1,-.7)]);mesh(group,new T.TubeGeometry(curve,16,.045,8,false),skin);}
 const smile=new T.CatmullRomCurve3([new T.Vector3(-.07,1.56,.255),new T.Vector3(0,1.53,.27),new T.Vector3(.07,1.56,.255)]);mesh(group,new T.TubeGeometry(smile,10,.009,5,false),dark);
 if(look.hat==='cap'){ball(group,dark,0,1.88,0,.26,.11,.24);ball(group,dark,0,1.84,.23,.23,.025,.17);}if(look.hat==='beanie')ball(group,shirt,0,1.88,0,.26,.14,.24);if(look.hat==='crown')for(let i=0;i<5;i++)mesh(group,new T.ConeGeometry(.065,.18,4),mat('#f5cf60'),(i-2)*.085,1.96,.09);
 if(look.outfit==='stripes')for(let i=0;i<4;i++){const ring=mesh(group,new T.TorusGeometry(.252,.024,6,22),white,0,.9+i*.1,0);ring.rotation.x=Math.PI/2;ring.scale.z=.85;}
 if(look.outfit==='hoodie'){ball(group,shirt,0,1.38,-.08,.27,.17,.19);for(const side of [-1,1])rod(group,white,[side*.07,1.35,.23],[side*.07,1.14,.27],.009);}
 if(look.outfit==='cape'){const cape=mesh(group,new T.ConeGeometry(.39,.75,16,1,true,0,Math.PI),mat('#a35889'),0,1.03,-.16);cape.rotation.y=Math.PI;cape.rotation.x=-.15;}
 if(look.accessory==='glasses'){for(const side of [-1,1])mesh(group,new T.TorusGeometry(.07,.012,6,20),dark,side*.085,1.7,.268);rod(group,dark,[-.02,1.7,.27],[.02,1.7,.27],.01);}
 if(look.accessory==='scarf')mesh(group,new T.TorusGeometry(.13,.05,8,20),mat('#f2c955'),0,1.41,0).rotation.x=Math.PI/2;
 return {group,animate(p,time){group.position.set(p.x,p.y,p.z);group.rotation.set(p.action?.type==='slide'?-.5:0,p.heading,0,'YXZ');for(const {arm,leg,side}of limbs){const phase=time*9+side*Math.PI;arm.rotation.x=p.action?.type==='climb'?-2+Math.sin(phase)*.5:p.action?.type==='slide'?-2.7:Math.sin(phase)*Math.min(.5,p.speed*.08);leg.rotation.x=Math.sin(phase)*Math.min(.45,p.speed*.07);}for(const {wing,side}of wings)wing.rotation.y=side*(.4+Math.sin(time*4)*.12);}};
}
