import * as T from './vendor/three/three.module.min.js';
const surfaces=new WeakMap();

// Fine, irregular scale relief belongs to the actual 3D skin, not a face photograph.
export function refineCompanionSurfaces(root,kit,materials){
 const old=materials.get('DragonSkin');if(!old||!kit.texture)return;
 let maps=surfaces.get(kit);
 if(!maps){
  const paint=(c,height)=>{let seed=871;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};c.fillStyle=height?'#555555':'#d6d9ce';c.fillRect(0,0,256,256);
   for(let row=-1;row<35;row++)for(let col=-1;col<35;col++){
    const x=col*8+(row%2)*4+(rand()-.5)*1.3,y=row*8+(rand()-.5)*1.3,r=3.3+rand()*.7;
    const g=c.createRadialGradient(x-.6,y-.9,.3,x,y,r*1.2);g.addColorStop(0,height?'#dedede':'#f4f2e8');g.addColorStop(.55,height?'#b6b6b6':'#eeeee3');g.addColorStop(1,height?'#626262':'#dcdfd2');
    c.fillStyle=g;c.beginPath();c.moveTo(x-r,y-.7);c.bezierCurveTo(x-r,y-r,x+r,y-r,x+r,y-.7);c.bezierCurveTo(x+r,y+r*.6,x,y+r*1.2,x,y+r*1.2);c.bezierCurveTo(x-r*.9,y+r*.6,x-r,y+.2,x-r,y-.7);c.fill();
   }
  };
  const color=kit.texture('companion-fine-scale-color',c=>paint(c,false)).map,bump=kit.texture('companion-fine-scale-relief',c=>paint(c,true)).map;
  for(const map of [color,bump]){map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;}bump.colorSpace=T.NoColorSpace;maps={color,bump};surfaces.set(kit,maps);
 }
 const skin=new T.MeshPhysicalMaterial({name:'DragonSkin',color:old.color,map:maps.color,bumpMap:maps.bump,bumpScale:.0025,roughness:.42,clearcoat:.30,clearcoatRoughness:.28,sheen:.10,sheenColor:'#cbd2bd',envMapIntensity:.65});
 skin.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 petSurface;').replace('#include <begin_vertex>','#include <begin_vertex>\npetSurface=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 petSurface;').replace('#include <color_fragment>',`#include <color_fragment>
   float chin=smoothstep(.65,.86,petSurface.z)*(1.-smoothstep(1.44,1.59,petSurface.y))*smoothstep(1.23,1.34,petSurface.y)*(1.-smoothstep(.36,.46,abs(petSurface.x)));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.76,.65,.43),chin*.78);
   vec3 cell=floor(petSurface*76.);float r=fract(sin(dot(cell,vec3(12.9898,78.233,39.425)))*43758.5453);
   float cheek=smoothstep(.24,.36,abs(petSurface.x))*(1.-smoothstep(.47,.53,abs(petSurface.x)))*smoothstep(1.35,1.44,petSurface.y)*(1.-smoothstep(1.54,1.62,petSurface.y))*smoothstep(.58,.70,petSurface.z);
   float dotShape=1.-smoothstep(.10,.30,length(fract(petSurface.xy*76.)-.5));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.56,.40,.13),step(.93,r)*dotShape*cheek*.6);
  `);
 };skin.customProgramCacheKey=()=>'approved-reference-companion-skin-1';
 root.traverse(o=>{if(o.isMesh&&o.material===old)o.material=skin;});materials.set('DragonSkin',skin);
 const wing=materials.get('DragonMembrane');if(wing){wing.roughness=.5;wing.side=T.DoubleSide;wing.envMapIntensity=.7;}
}
