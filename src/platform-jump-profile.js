import {JUMP_DEFAULTS,validateJumpSettings,JUMP_PROFILE_VERSION} from './platform-jump-rules.js';
export const JUMP_PROFILE_KEY='sidequest.platform-jump';
export function prepareJumpProfile(value={},owned=[]){
 const saved=value&&typeof value==='object'?value:{};
 const settings=validateJumpSettings(saved,owned);
 if(saved.profileVersion!==JUMP_PROFILE_VERSION){
  // Update older starters once; later character and pet choices remain saved.
  for(const key of ['skin','hair','shirt','pants','hairstyle','outfit','facialHair','pet','breed','petName'])settings[key]=JUMP_DEFAULTS[key];
 }
 return settings;
}
export function loadJumpProfile(storage,owned=[]){
 let value={};try{value=JSON.parse(storage.getItem(JUMP_PROFILE_KEY)||'{}');}catch{}
 const settings=prepareJumpProfile(value,owned);
 try{storage.setItem(JUMP_PROFILE_KEY,JSON.stringify(settings));}catch{}
 return settings;
}
