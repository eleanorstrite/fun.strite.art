import { createSkyFlight, drawFlightPreview } from './sky-flight.js';
import { createKnightMaze, drawKnightPreview } from './knight-maze.js';
// Register future games here. Engines receive a canvas and shared character/modifiers.
// Each renderer returns start(), pause(), and destroy(); onFinish reports earned coins.
export const GAMES = [
  { id: 'knight-ember', name: 'Knights and Dragons', dimension: '2D', genre: 'ARCADE MAZE QUEST', description: 'Explore four colorful dragon mazes. Gather gems, find a sword, and turn the chase around for 10 seconds.', tone: 'dungeon', mode: 'FOUR LEVELS · THREE LIVES', instructions: 'Walk through the glowing side portals to appear on the opposite edge. Move with WASD / arrow keys, swipe, or use the direction buttons. Collect every gem to win. Swords grant 10 seconds to defeat dragons on contact. Collect all gems for 30 coins, plus 2 per dragon (up to 10 bonus coins). Partial runs earn proportionally less. Defeated dragons return after 8 seconds.', width: 760, height: 760, directional: true, preview: drawKnightPreview, create: createKnightMaze },
  { id:'sky-flight', name:'Flappy Animals', dimension:'2D', genre:'FLAP & FLY', description:'Take wing as a dragon, hummingbird, eagle, or a jetpack capybara, cat, or dog. Find your rhythm through colorful skies and earn coins with every clear.', tone:'sky', mode:'FIVE DIFFICULTIES · ENDLESS FLIGHT', instructions:'Tap the sky or Flap button, or press Space / ↑ to fly. Avoid pipes, the ground, and the top edge. Each pipe pair earns 1 coin on Sloth or Easy, 3 on Medium, 5 on Hard, or 10 on Expert. Choose your flyer and difficulty below before starting.', width:540, height:720, flight:true, preview:drawFlightPreview, create:createSkyFlight },
];

export function drawPreview(canvas, game, character, modifiers) {
  game.preview?.(canvas, character, modifiers);
}
