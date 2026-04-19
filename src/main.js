import { Game } from './core/Game.js';

const game = new Game();

window.addEventListener('resize', () => {
  game.resize(window.innerWidth, window.innerHeight);
});

game.start();
