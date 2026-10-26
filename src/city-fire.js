export const CITY_FIRE_SECONDS=60;
export const CITY_TRUCK_DOOR={x:-.25,z:.7};
export const cityNearTruck=player=>Math.hypot(player.x-CITY_TRUCK_DOOR.x,player.z-CITY_TRUCK_DOOR.z)<1.35;
export function createCityFireTrip(){return {remaining:CITY_FIRE_SECONDS,x:0,z:12,angle:Math.PI,speed:0,steering:0,spraying:false,elapsed:0,extinguished:0,fires:[[0,3],[-9,-5],[10,-8],[-18,8],[17,16],[-7,-22],[21,-23],[-24,-18]].map(([x,z],id)=>({id,x,z,health:1}))};}
export function cityTickFireTrip(trip,dt,input={}){
 if(trip.remaining<=0)return;dt=Math.min(Math.max(0,dt),trip.remaining);trip.remaining=Math.max(0,trip.remaining-dt);trip.elapsed+=dt;
 const throttle=Number(Boolean(input.up))-Number(Boolean(input.down)),steer=Number(Boolean(input.left))-Number(Boolean(input.right));trip.steering=steer;
 const target=throttle*(throttle>0?9:4);trip.speed+=(target-trip.speed)*Math.min(1,dt*3);trip.angle+=steer*dt*(.65+Math.abs(trip.speed)*.075)*(trip.speed<-.1?-1:1);
 trip.x=Math.max(-32,Math.min(32,trip.x+Math.sin(trip.angle)*trip.speed*dt));trip.z=Math.max(-32,Math.min(32,trip.z+Math.cos(trip.angle)*trip.speed*dt));
 trip.spraying=Boolean(input.spray)&&trip.remaining>0;
 if(trip.spraying)for(const fire of trip.fires){if(fire.health<=0)continue;const dx=fire.x-trip.x,dz=fire.z-trip.z,distance=Math.hypot(dx,dz),ahead=(dx*Math.sin(trip.angle)+dz*Math.cos(trip.angle))/Math.max(.001,distance);if(distance<17&&distance>1&&ahead>.955){fire.health=Math.max(0,fire.health-dt*.55);if(fire.health===0)trip.extinguished++;}}
 if(trip.remaining===0){trip.spraying=false;trip.speed=0;}
}
export const CITY_FIRE_VICTORY_SECONDS=5;
export const CITY_FIRE_VICTORY_LINE='Hooray! You saved the town!';
export const cityFireTripWon=trip=>trip.fires.length>0&&trip.fires.every(fire=>fire.health<=0);
