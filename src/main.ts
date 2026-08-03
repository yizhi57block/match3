import './style.css';
import { createGame } from './game';

const game = createGame();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
