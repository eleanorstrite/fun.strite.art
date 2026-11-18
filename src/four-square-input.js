import {FOUR_SQUARE_ROLES,fourSquareRole,serveFourSquare,hitFourSquare} from './four-square-rules.js';
export function fourSquareRankAt(point){if(!point||Math.abs(point.x)>4||Math.abs(point.z)>4)return null;const index=FOUR_SQUARE_ROLES.findIndex(r=>Math.abs(point.x-r.x)<=2&&Math.abs(point.z-r.z)<=2);return index<0?null:index;}
export function fourSquareNumberServe(s,key){if(!/^[1-4]$/.test(key))return false;return serveFourSquare(s,Number(key)-1);}
export function fourSquareTap(s,pick){if(!pick)return false;if(s.phase==='serve'&&fourSquareRole(s)===0)return pick.square!==null&&pick.square!==undefined?serveFourSquare(s,pick.square):false;return s.phase==='rally'&&pick.player?hitFourSquare(s):false;}
