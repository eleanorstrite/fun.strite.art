import {createFlightState,flapFlight,tickFlight} from './flight-rules.js';
import {FLIGHT_DEFAULTS,FLIGHT_ANIMALS} from './flight-settings.js';
export const FLIGHT_DUEL_KEY='sidequest.flight.duel';
export function flightDuelSettings(value){return {mode:value?.mode==='local'?'local':'single',animal:Object.hasOwn(FLIGHT_ANIMALS,value?.animal)?value.animal:'bluebird',color:/^#[0-9a-f]{6}$/i.test(value?.color)?value.color:'#70b8d5'};}
export function loadFlightDuel(storage){try{storage??=globalThis.localStorage;return flightDuelSettings(JSON.parse(storage?.getItem(FLIGHT_DUEL_KEY)));}catch{return flightDuelSettings();}}
const randomFrom=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export function createFlightDuel(settings=FLIGHT_DEFAULTS,rival=flightDuelSettings(),seed=Math.floor(Math.random()*4294967296)){
 return {players:[createFlightState({...settings,view:'side'},randomFrom(seed)),createFlightState({...settings,view:'side',animal:rival.animal,color:rival.color},randomFrom(seed))],status:'ready',winner:null};
}
export function startFlightDuel(s){s.status='playing';s.winner=null;for(const p of s.players){p.status='playing';flapFlight(p);}}
export function flapFlightDuel(s,index){const p=s.players[index];if(s.status!=='playing'||!p||p.status!=='playing')return false;flapFlight(p);return true;}
export function tickFlightDuel(s,dt,onPass=()=>{}){
 if(s.status!=='playing')return;dt=Math.max(0,Math.min(.1,dt));for(let i=0;i<2;i++){const p=s.players[i];if(p.status==='playing')tickFlight(p,dt,coins=>onPass(i,coins));else p.crashTime=Math.min(2,p.crashTime+dt);}
 if(s.players.every(p=>p.status==='lost'&&p.crashTime>=2)){s.status='finished';const[a,b]=s.players,score=p=>p.passed*100000+p.time;s.winner=Math.abs(score(a)-score(b))<1e-7?-1:score(a)>score(b)?0:1;}
}
export function flightDuelPlayerAt(x,width){return x<width/2?0:1;}
