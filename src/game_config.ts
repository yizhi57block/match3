import Phaser from 'phaser';

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
  // Width and height, in game pixels, occupied by one board cell.
  gemSize: 100,
  // Duration, in milliseconds, of an adjacent-gem swap.
  swapSpeed: 200,
  // Duration, in milliseconds, for a gem to fall by one board cell.
  fallSpeed: 100,
  // Duration, in milliseconds, of the matched-gem fade animation.
  destroySpeed: 200,
  // Pause, in milliseconds, before resolving the next cascade.
  cascadeDelay: 250,
  selection: {
    // Whether clicking a gem visually enlarges it while it is selected.
    enlargeOnSelect: true,
    // Selected-gem size multiplier; values above 1 make the gem larger.
    scale: 1.15,
    // Render depth used to draw the selected gem above neighboring gems.
    depth: 1,
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

// Extra space needed on each edge to keep an enlarged boundary gem visible.
export const BOARD_PADDING = GAME_CONFIG.selection.enlargeOnSelect
  ? Math.ceil(
      (GAME_CONFIG.gemSize * Math.max(GAME_CONFIG.selection.scale - 1, 0)) / 2,
    )
  : 0;

// Pixel coordinate at which the board begins inside the padded game canvas.
export const BOARD_ORIGIN = BOARD_PADDING;

// Total logical canvas width, including the selection-safe edge margins.
export const GAME_WIDTH =
  GAME_CONFIG.fieldSize.width * GAME_CONFIG.gemSize + BOARD_PADDING * 2;

// Total logical canvas height, including the selection-safe edge margins.
export const GAME_HEIGHT =
  GAME_CONFIG.fieldSize.height * GAME_CONFIG.gemSize + BOARD_PADDING * 2;

/** Creates the Phaser config after the scene class is available. */
export function createPhaserGameConfig(
  scene: Phaser.Types.Scenes.SceneType,
): Phaser.Types.Core.GameConfig {
  return {
    // Automatically prefer WebGL and fall back to Canvas when necessary.
    type: Phaser.AUTO,
    // Use the configured game title in Phaser's startup banner.
    title: GAME_CONFIG.phaser.title,
    // Fill the canvas and the selection-safe margin with the skin background.
    backgroundColor: GAME_CONFIG.skin.backgroundColor,
    scale: {
      // Mount the canvas in the configured browser element.
      parent: GAME_CONFIG.phaser.parent,
      // Preserve the configured board aspect ratio within the browser viewport.
      mode: Phaser.Scale.FIT,
      // Center the fitted canvas horizontally and vertically.
      autoCenter: Phaser.Scale.CENTER_BOTH,
      // Use the rectangular board width plus its selection-safe margins.
      width: GAME_WIDTH,
      // Use the rectangular board height plus its selection-safe margins.
      height: GAME_HEIGHT,
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
