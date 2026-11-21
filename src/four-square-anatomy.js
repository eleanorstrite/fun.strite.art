import * as T from './vendor/three/three.module.min.js';
// A single continuous head surface: shaped jaw, cheeks, brow and eye sockets.
export function fourSquareHeadGeometry(){
 const geometry=new T.SphereGeometry(1,56,40),p=geometry.attributes.position;
 const bump=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
 for(let i=0;i<p.count;i++){
  const nx=p.getX(i),ny=p.getY(i),nz=p.getZ(i),jaw=1-.035*Math.max(0,-ny),x=nx*.282*jaw,y=ny<-.55?-.17+(ny+.55)*.19:ny*.309;let z=nz*.255;
  if(nz>0){const face=Math.min(1,nz*3);z+=face*(.018*bump(x,y,0,.005,.065,.13)+.014*bump(x,y,-.14,-.06,.1,.1)+.014*bump(x,y,.14,-.06,.1,.1)-.012*bump(x,y,-.10,.06,.075,.065)-.012*bump(x,y,.10,.06,.075,.065));}
  p.setXYZ(i,x,y,z);
 }
 geometry.computeVertexNormals();const normals=geometry.attributes.normal;for(let i=0;i<normals.count;i++)if(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))<.5){const length=Math.hypot(p.getX(i),p.getY(i),p.getZ(i));normals.setXYZ(i,p.getX(i)/length,p.getY(i)/length,p.getZ(i)/length);}return geometry;
}
export function fourSquareSkinMaterial(color,{coach=false,textures,materials,key}){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,512,512);
 function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 glow(128,215,80,'#fff4dc22');for(const x of [94,162])glow(x,273,27,'#c56e6536');glow(128,260,13,'#cf8b6d28');
 if(coach){glow(128,306,47,'#3c302d45');for(let i=0;i<600;i++){const x=88+(i*37)%80,y=282+(i*23)%38;ctx.fillStyle='#332a2413';ctx.fillRect(x,y,1,1);}}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;textures.push(map);const m=new T.MeshPhysicalMaterial({color:'#ffffff',map,roughness:.68,metalness:0,clearcoat:.035,sheen:.12,sheenColor:new T.Color(color)});materials.set(key,m);return m;
}
