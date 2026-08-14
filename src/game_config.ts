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
    // Space left around the board's outer frame, in logical pixels. The gem
    // size budget subtracts these gutters *and* the board frame border, so the
    // decorated frame is never clipped by the viewport edges.
    horizontalPadding: 12,
    verticalPadding: 24,
  },
  // Render order for every layer. Lower values draw further back. Side
  // decorations stay behind the board frame so they can never occlude a cell.
  depths: {
    // 全屏背景图，始终位于最底层
    sceneBackground: -40,
    // 后层装饰（猫爬架、展示台长凳）
    backDecoration: -30,
    // 前层装饰（猫咪、已收集道具），压在后层装饰之上但仍在棋盘之下
    frontDecoration: -20,
    // 棋盘外框图，永远盖住任何装饰物
    boardFrame: -10,
    // 棋盘宝石
    gem: 0,
    // 常驻 UI（BGM 开关等）
    ui: 2,
    // 胜负结算弹窗
    outcomePopup: 10,
  },
  // Placement rules for the scene decorations that flank the board.
  decorations: {
    // 装饰物与画布边缘之间的留白（逻辑像素）
    screenMargin: 16,
    // 装饰物与棋盘外框之间的最小间隔（逻辑像素）
    boardGap: 16,
    // 棋盘两侧留白窄于该值时，改用棋盘上/下方的紧凑布局
    minSideBandWidth: 200,
    // 装饰物相对原始尺寸的最小缩放。低于该值直接隐藏，避免糊成小色块
    minScale: 0.24,
    // 猫咪站台在猫爬架显示高度上的位置比例（0=顶部，1=底部）
    catPerchRatio: 0.66,
    // 猫咪显示高度相对猫爬架显示高度的比例
    catHeightRatio: 0.116,
    // 紧凑布局下猫咪的显示高度上限（逻辑像素）
    catCompactMaxHeight: 132,
    keyIcons: {
      // 道具图标显示宽度相对展示台显示宽度的比例
      widthRatio: 0.22,
      // 图标落点在展示台显示高度上的位置比例（自台面顶部向下）
      surfaceRatio: 0.42,
      // 相邻图标中心间距相对展示台显示宽度的比例
      spacingRatio: 0.27,
      // 收集时的弹出动画时长（毫秒）与起始缩放比例
      popDuration: 300,
      popFromScale: 0.55,
    },
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
      // Scene1: 游戏失败画面
      textureKey: 'game-fail',
      imageUrl: '/scene1/ui/game_fail.webp',
    },
  },
  victoryCondition: {
    // Each configured key replaces one random gem when the board is created.
    // Key positions are unique and never use the bottom row.
    // Scene1: 猫咪喜欢的三个道具
    keys: [
      {
        textureKey: 'key-mouse',
        imageUrl: '/scene1/keys/key_mouse.webp',
        name: '老鼠玩具',
      },
      {
        textureKey: 'key-bowl',
        imageUrl: '/scene1/keys/key_bowl.webp',
        name: '猫碗',
      },
      {
        textureKey: 'key-fish',
        imageUrl: '/scene1/keys/key_fish.webp',
        name: '小鱼',
      },
    ],
    successImage: {
      // Phaser texture-cache key and root-relative URL for the victory popup.
      // Scene1: 游戏胜利画面
      textureKey: 'game-success',
      imageUrl: '/scene1/ui/game_success.webp',
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
    // Scene1: 35秒循环背景音乐
    audioUrl: '/scene1/audio/bgm.mp3',
    // Root-relative image shown while background music is playing.
    playingImageUrl: '/scene1/ui/sound_on.png',
    // Root-relative image shown while background music is paused or stopped.
    pausedImageUrl: '/scene1/ui/sound_off.png',
    // Start the music from the first click or tap anywhere in the game.
    startOnFirstPointerDown: true,
    // Per-track volume, from 0 (silent) through 1 (full volume).
    volume: 0.3,
    // Logical display size of the music-status button in game pixels.
    buttonSize: 56,
    // Distance between the button and the top/right canvas edges.
    buttonMargin: 16,
  },
  soundEffects: {
    click: {
      // Played once when a player selects a gem.
      // Scene1: 宝石点击音效
      textureKey: 'gem-click',
      audioUrl: '/scene1/audio/click.mp3',
      volume: 0.6,
    },
    swap: {
      // Played when gems are swapped.
      // Scene1: 移动宝石音效
      textureKey: 'gem-swap',
      audioUrl: '/scene1/audio/swap.mp3',
      volume: 0.5,
    },
    match3: {
      // Played for a three-gem removal.
      // Scene1: 三消音效
      textureKey: 'match-3',
      audioUrl: '/scene1/audio/match1.mp3',
      volume: 0.7,
    },
    match4: {
      // Played when four or more gems are removed in one resolution.
      // Scene1: 四消及以上音效
      textureKey: 'match-4',
      audioUrl: '/scene1/audio/match3.mp3',
      volume: 0.8,
    },
    noBreak: {
      // Played when an attempted swap does not create a match.
      // Scene1: 无效交换音效（使用pop音效）
      textureKey: 'no-break',
      audioUrl: '/scene1/audio/pop.mp3',
      volume: 0.5,
    },
    gameFail: {
      // Played once when any configured failure condition is reached.
      // Scene1: 游戏失败音效
      textureKey: 'game-fail',
      audioUrl: '/scene1/audio/game_fail.mp3',
      volume: 0.8,
    },
    victory: {
      // Played when the game is won.
      // Scene1: 喵咪舒服的叫声
      textureKey: 'game-victory',
      audioUrl: '/scene1/audio/victory.mp3',
      volume: 0.7,
    },
    applause: {
      // Celebratory sound for victory.
      // Scene1: 鼓掌声
      textureKey: 'applause',
      audioUrl: '/scene1/audio/applause.mp3',
      volume: 0.6,
    },
    keyCollect: {
      // Played when collecting a key item.
      // Scene1: 收集关键道具音效
      textureKey: 'key-collect',
      audioUrl: '/scene1/audio/match2.mp3',
      volume: 0.7,
    },
  },
  skin: {
    // Page, canvas, and exposed board-margin color for the current skin.
    // Scene1: 温馨室内场景，猫咪主题
    backgroundColor: '#f4e4d7',
    // 全屏背景图片
    background: {
      textureKey: 'scene-background',
      imageUrl: '/scene1/bg/background.webp',
    },
    // 棋盘背景图片（带边框）
    board: {
      textureKey: 'game-board',
      imageUrl: '/scene1/bg/board.webp',
      // 棋盘图片的实际可用区域（去除边框后）
      padding: {
        top: 45,
        right: 28,
        bottom: 45,
        left: 28,
      },
    },
    gems: {
      // Phaser texture-cache key used by all gem images.
      textureKey: 'gems',
      // Root-relative URL of the current skin's gem sprite sheet.
      spritesheetUrl: '/scene1/gems/gems.png',
      // Native width, in source pixels, of each sprite-sheet frame.
      frameWidth: 100,
      // Native height, in source pixels, of each sprite-sheet frame.
      frameHeight: 100,
      // Number of gem frames from the sprite sheet available to board logic.
      // Scene1 有4种宝石：紫色钻石、橘黄棱形、粉红桃心、绿色多面体
      frameCount: 4,
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
