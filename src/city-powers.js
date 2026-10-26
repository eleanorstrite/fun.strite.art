export const CITY_POWER_SECONDS=30;
export const CITY_FOOD_POWERS={galaxyShake:'flight',fruitCup:'speed',cake:'flowers'};
export function createCityPowers(){return {flight:0,speed:0,flowers:0};}
export function cityGrantPower(powers,food){const kind=CITY_FOOD_POWERS[food];if(kind)powers[kind]=CITY_POWER_SECONDS;return kind??null;}
export function cityTickPowers(powers,dt){for(const kind of Object.values(CITY_FOOD_POWERS))powers[kind]=Math.max(0,powers[kind]-Math.max(0,dt));}
export function cityPowerMessage(powers){return [powers.flight>0?`Now fly! ${Math.ceil(powers.flight)}s · Outside, hold Space to rise; use arrows to fly. Release to land.`:'',powers.speed>0?`Golden speed! ${Math.ceil(powers.speed)}s · Run outside to leave a sparkling golden trail.`:'',powers.flowers>0?`Rainbow garden! ${Math.ceil(powers.flowers)}s · Hold Space outside to grow rainbow flowers.`:''].filter(Boolean).join('\n');}
