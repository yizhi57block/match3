import './style.css';
import { createGame } from './game';
import { GAME_CONFIG } from './game_config';

document.documentElement.style.setProperty(
  '--game-background-color',
  GAME_CONFIG.skin.backgroundColor,
);

const game = createGame();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
