import Phaser from 'phaser';

type BoardPosition = number | 'center';

/**
 * Match-3 gameplay, presentation, and skin configuration.
 *
 * Keep skin-specific asset paths and visual values here so a future skin can
 * be applied without changing the board logic in `game.ts`.
 */
export const GAME_CONFIG = {
  fieldSize: {
    // Number of gem columns (the horizontal board length).
    width: 6,
    // Number of gem rows (the vertical board length).
    height: 8,
  },
  board: {
    // Board position inside the full-screen canvas. Use a pixel coordinate or
    // 'center' on either axis; the default keeps the board centered.
    position: {
      x: 'center' as BoardPosition,
      y: 'center' as BoardPosition,
    },
  },
  layout: {
    // Largest visual size of a board cell. Desktop layouts retain this size.
    maxGemSize: 100,
    // Smallest comfortable touch target. This still fits a 6-column board on
    // a 320px-wide device when selection overflow and gutters are included.
    minGemSize: 48,
    // Space left around the enlarged boundary gems, in logical pixels.
    horizontalPadding: 12,
    verticalPadding: 24,
  },
  // Duration, in milliseconds, of an adjacent-gem swap.
  swapSpeed: 200,
  // Duration, in milliseconds, for a gem to fall by one board cell.
  fallSpeed: 100,
  // Duration, in milliseconds, of the matched-gem fade animation.
  destroySpeed: 200,
  // Pause, in milliseconds, before resolving the next cascade.
  cascadeDelay: 250,
  failureConditions: {
    // Maximum number of swaps that produce no match. Set to 0 or less to
    // disable this failure condition. A positive value fails the game when
    // the player reaches that many incorrect swaps.
    allowedWrongMoves: 0,
    // Maximum game duration in seconds. Set to 0 or less to disable the
    // countdown failure condition.
    countdownSeconds: 0,
    failImage: {
      // Phaser texture-cache key and root-relative URL for the failure popup.
      textureKey: 'game-fail',
      imageUrl: '/game_fail.webp',
    },
  },
  victoryCondition: {
    // Each configured key replaces one random gem when the board is created.
    // Key positions are unique and never use the bottom row.
    keys: [
      {
        textureKey: 'key-1',
        imageUrl: '/keys/key1.webp',
      },
      {
        textureKey: 'key-2',
        imageUrl: '/keys/key2.webp',
      },
      {
        textureKey: 'key-3',
        imageUrl: '/keys/key3.webp',
      },
    ],
    successImage: {
      // Phaser texture-cache key and root-relative URL for the victory popup.
      textureKey: 'game-success',
      imageUrl: '/game_success.webp',
    },
  },
  outcomePopup: {
    // Both victory and failure popups occupy at most this portion of the
    // narrower viewport axis, keeping their final size comfortably compact.
    maxViewportCoverage: 0.62,
    // Initial scale, relative to the fitted final popup size.
    initialScale: 0.1,
    // Duration, in milliseconds, of the shared grow-in animation.
    popDuration: 280,
  },
  selection: {
    // Whether clicking a gem visually enlarges it while it is selected.
    enlargeOnSelect: true,
    // Selected-gem size multiplier; values above 1 make the gem larger.
    scale: 1.15,
    // Render depth used to draw the selected gem above neighboring gems.
    depth: 1,
  },
  backgroundMusic: {
    // Phaser audio-cache key used by the background music instance.
    textureKey: 'background-music',
    // Root-relative URL of the looping background music track.
    audioUrl: '/bg_music.mp3',
    // Root-relative image shown while background music is playing.
    playingImageUrl: '/video_on.png',
    // Root-relative image shown while background music is paused or stopped.
    pausedImageUrl: '/video_off.png',
    // Start the music from the first click or tap anywhere in the game.
    startOnFirstPointerDown: true,
    // Per-track volume, from 0 (silent) through 1 (full volume).
    volume: 0.4,
    // Logical display size of the music-status button in game pixels.
    buttonSize: 48,
    // Distance between the button and the top/right canvas edges.
    buttonMargin: 12,
  },
  soundEffects: {
    click: {
      // Played once when a player selects a gem.
      textureKey: 'gem-click',
      audioUrl: '/click.mp3',
      volume: 0.7,
    },
    match3: {
      // Played for a three-gem removal.
      textureKey: 'match-3',
      audioUrl: '/match3.mp3',
      volume: 0.8,
    },
    match4: {
      // Played when four or more gems are removed in one resolution.
      textureKey: 'match-4',
      audioUrl: '/match4.mp3',
      volume: 0.8,
    },
    noBreak: {
      // Played when an attempted swap does not create a match.
      textureKey: 'no-break',
      audioUrl: '/no_break.mp3',
      volume: 0.7,
    },
    gameFail: {
      // Played once when any configured failure condition is reached.
      textureKey: 'game-fail',
      audioUrl: '/game_fail.mp3',
      volume: 0.9,
    },
  },
  skin: {
    // Page, canvas, and exposed board-margin color for the current skin.
    backgroundColor: '#000000',
    gems: {
      // Phaser texture-cache key used by all gem images.
      textureKey: 'gems',
      // Root-relative URL of the current skin's gem sprite sheet.
      spritesheetUrl: '/sprites/gems.png',
      // Native width, in source pixels, of each sprite-sheet frame.
      frameWidth: 100,
      // Native height, in source pixels, of each sprite-sheet frame.
      frameHeight: 100,
      // Number of gem frames from the sprite sheet available to board logic.
      frameCount: 6,
    },
  },
  phaser: {
    // Browser element ID that receives Phaser's canvas.
    parent: 'app',
    // Title displayed in Phaser's startup banner.
    title: 'Match 3',
    // Enables smooth texture filtering when gems are scaled.
    antialias: true,
    // Keeps sub-pixel positions instead of snapping rendered gems to integers.
    roundPixels: false,
  },
} as const;

/** Creates the Phaser config after the scene class is available. */
export function createPhaserGameConfig(
  scene: Phaser.Types.Scenes.SceneType,
): Phaser.Types.Core.GameConfig {
  return {
    // Automatically prefer WebGL and fall back to Canvas when necessary.
    type: Phaser.AUTO,
    // Use the configured game title in Phaser's startup banner.
    title: GAME_CONFIG.phaser.title,
    // Fill the full browser viewport with the skin background.
    backgroundColor: GAME_CONFIG.skin.backgroundColor,
    scale: {
      // Mount the canvas in the configured browser element.
      parent: GAME_CONFIG.phaser.parent,
      // Resize the logical canvas with its full-screen parent.
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
    },
    render: {
      // Apply the configured smoothing mode when textures are scaled.
      antialias: GAME_CONFIG.phaser.antialias,
      // Apply the configured pixel-rounding behavior to rendered gems.
      roundPixels: GAME_CONFIG.phaser.roundPixels,
    },
    // Start the supplied match-3 scene when Phaser finishes booting.
    scene,
  };
}
