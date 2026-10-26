// Plot coordinates make a home's personality stable across reloads and map resizing.
const HOME_THEMES=['cinema','cat','dog','artist','reader','gardener'];
const HOME_COLORS=['#527e9a','#a36b96','#c0854f','#4c9990','#8275aa','#649359'];
const DOGS=[
  {name:'golden retriever',fur:'#d3a35c',mark:'#edcc91',ears:'floppy',size:1.1,legs:1},
  {name:'Dalmatian',fur:'#eeeae0',mark:'#353637',ears:'floppy',size:1,legs:1.1,pattern:'spots'},
  {name:'corgi',fur:'#b76d37',mark:'#f4e6cc',ears:'pointed',size:.85,legs:.65,pattern:'chest'},
  {name:'husky',fur:'#7e8791',mark:'#f1eee6',ears:'pointed',size:1.05,legs:1,pattern:'chest'}
];
const CATS=[
  {name:'ginger tabby',fur:'#cb8748',mark:'#87572d',ears:'pointed',size:1,legs:1,pattern:'stripes'},
  {name:'silver tabby',fur:'#a5a7ad',mark:'#525863',ears:'pointed',size:.9,legs:1,pattern:'stripes'},
  {name:'tuxedo cat',fur:'#30343c',mark:'#f4efe5',ears:'pointed',size:1.1,legs:1,pattern:'chest'},
  {name:'Siamese cat',fur:'#d9c7a7',mark:'#5b463d',ears:'pointed',size:.95,legs:1.15,pattern:'points'}
];
export function cityHomeStyle(size,index){
  const x=index%size,z=Math.floor(index/size),seed=(Math.imul(x+1,73856093)^Math.imul(z+1,19349663))>>>0;
  const variation=(Math.floor(x/6)+Math.floor(z/2)+(z%2)*2)%4;
  return {dog:DOGS[variation],cat:CATS[variation],painting:['sunset','mountains','flowers','ocean'][variation],theme:HOME_THEMES[(x+z*3)%HOME_THEMES.length],color:HOME_COLORS[seed%HOME_COLORS.length],accent:['#ead4bb','#d3e3df','#e8d6e6','#f0dfb2'][seed%4],phase:(seed%100)/10,address:`${x+1} · ${z+1}`};
}
export function cityActivityPose(activity,time,phase=0){
  const t=time+phase,slow=Math.sin(t*1.5),tap=Math.sin(t*7);
  const pose={left:-.25,right:-.25,head:Math.sin(t*.7)*.09,lean:slow*.015};
  if(activity==='eat'||activity==='drink'){pose.right=-.65-(.5+.5*Math.sin(t*1.8))*1.25;pose.head=slow*.06;}
  else if(activity==='type'){pose.left=-1.05+tap*.12;pose.right=-1.05-tap*.12;pose.head=-.13;}
  else if(activity==='write'||activity==='paint'){pose.right=-1.1+Math.sin(t*4)*.22;pose.left=-.65;pose.head=-.1;}
  else if(activity==='serve'){pose.left=-.8+slow*.3;pose.right=-.8-slow*.3;}
  else if(activity==='read'){pose.left=pose.right=-1.05;pose.right+=Math.sin(t*.8)*.12;pose.head=-.16;}
  else if(activity==='water'){pose.right=-.9+slow*.25;pose.head=.15;}
  else {pose.right=-.65+slow*.12;}
  return pose;
}
export function cityPetPose(time,phase=0){
  const t=(time+phase)*.45;
  return {x:.25+Math.sin(t)*.45,z:Math.cos(t)*1.7,angle:Math.atan2(.45*Math.cos(t),-1.7*Math.sin(t)),stride:Math.sin((time+phase)*9)*.32,tail:Math.sin((time+phase)*5)*.3};
}

// Trigger just before solid collision, including glancing contact and approaches
// that start near the edge. Movement away from furniture must not sit you down.
export function cityFurnitureAt(obstacles,from,to){
  if(!obstacles||Math.hypot(to.x-from.x,to.z-from.z)<1e-8)return null;
  const distance=(p,item)=>Math.hypot(Math.max(0,Math.abs(p.x-item.x)-item.w/2),Math.max(0,Math.abs(p.z-item.z)-item.d/2));
  const touched=obstacles.find(item=>item.use&&distance(to,item)<.38&&distance(to,item)<distance(from,item));
  if(!touched)return null;
  if(!touched.use.occupied)return touched.use;
  // A diner keeps their seat; take the free chair at that table instead.
  return touched.use.mealId===undefined?null:obstacles.find(item=>item.use&&!item.use.occupied&&item.use.mealId===touched.use.mealId)?.use??null;
}
export function cityNearbyMealSeat(obstacles,player){
  return obstacles?.filter(item=>item.use?.mealId!==undefined&&!item.use.occupied)
    .map(item=>({seat:item.use,distance:Math.hypot(item.use.x-player.x,item.use.z-player.z)}))
    .filter(item=>item.distance<2.2).sort((a,b)=>a.distance-b.distance)[0]?.seat??null;
}
