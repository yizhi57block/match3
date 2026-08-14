import Phaser from 'phaser';

type BoardPosition = number | 'center' | 'responsive';

/**
 * Scene1 的玩法、资源、布局和动画配置。
 *
 * 皮肤 URL、texture key、尺寸、层级和节奏都集中在这里；`game.ts`
 * 只消费配置，不散落 Scene1 文件名或皮肤色值。
 */
export const GAME_CONFIG = {
  fieldSize: {
    // 棋盘列数；Scene1 棋盘原图按 6 列设计。
    width: 6,
    // 棋盘行数；Scene1 棋盘原图按 8 行设计。
    height: 8,
  },
  board: {
    position: {
      // `responsive` 会为宽屏角色舞台让位；也可改为像素或 `center`。
      x: 'responsive' as BoardPosition,
      // `responsive` 会在生命栏与展示台之间垂直居中棋盘。
      y: 'responsive' as BoardPosition,
    },
    // 棋盘底图的 Phaser texture key。
    textureKey: 'scene1-board',
    // 从 public 根目录访问的棋盘底图 URL。
    imageUrl: '/scene1/images/board.webp',
    // 棋盘底图位于宝石之后、全屏背景之前。
    depth: 1,
  },
  layout: {
    // 桌面端单格最大逻辑尺寸，避免放大低分辨率宝石。
    maxGemSize: 92,
    // 理想的最小触控尺寸；极窄屏仍会以不溢出为最高优先级。
    minGemSize: 42,
    // 棋盘/界面距离视口安全边缘的最小像素数。
    outerMargin: 12,
    // 生命栏区域的理想高度；实际布局会按视口比例收缩。
    topReserve: 118,
    // 关键物展示台区域的理想高度；实际布局会按视口比例收缩。
    bottomReserve: 112,
    // 棋盘与宽屏猫咪舞台之间的间隔。
    boardStageGap: 18,
    // 小于该宽度时隐藏猫爬架，只保留右上角猫咪反馈。
    compactBreakpoint: 520,
    // 宽屏猫咪舞台占视口宽度的比例。
    stageWidthRatio: 0.25,
    // 宽屏猫咪舞台最小宽度。
    stageMinWidth: 150,
    // 宽屏猫咪舞台最大宽度。
    stageMaxWidth: 280,
    // 背景和界面布局使用此补间时长平滑适配 resize。
    resizeTweenDuration: 0,
  },
  animations: {
    // 相邻宝石交换用时（毫秒）。
    swapSpeed: 190,
    // 每下落一格的用时（毫秒）。
    fallSpeed: 92,
    // 宝石缩小消失的用时（毫秒）。
    destroySpeed: 210,
    // 下一轮连锁解析前的停顿（毫秒）。
    cascadeDelay: 170,
    // 没有可行交换时重新排布宝石的缩放动画时长。
    reshuffleDuration: 220,
  },
  failureConditions: {
    // 允许的无效交换次数；与设计稿顶部 5 颗心一致。
    allowedWrongMoves: 5,
    // 可选倒计时（秒）；0 表示 Scene1 默认不启用计时失败。
    countdownSeconds: 0,
    failImage: {
      // 失败结算图片的 texture key。
      textureKey: 'scene1-fail',
      // 失败结算图片 URL。
      imageUrl: '/scene1/images/fail.webp',
    },
  },
  victoryCondition: {
    // 三个关键物替换随机非底行宝石，且彼此位置唯一。
    keys: [
      {
        id: 'mouse',
        textureKey: 'scene1-key-mouse',
        imageUrl: '/scene1/images/key-mouse.webp',
      },
      {
        id: 'bowl',
        textureKey: 'scene1-key-bowl',
        imageUrl: '/scene1/images/key-bowl.webp',
      },
      {
        id: 'fish',
        textureKey: 'scene1-key-fish',
        imageUrl: '/scene1/images/key-fish.webp',
      },
    ],
    successImage: {
      // 胜利结算图片的 texture key。
      textureKey: 'scene1-success',
      // 胜利结算图片 URL。
      imageUrl: '/scene1/images/success.webp',
    },
  },
  selection: {
    // 选中时宝石相对原尺寸的放大倍数。
    scale: 1.08,
    // 选中环相对单格尺寸的半径比例。
    ringRadiusRatio: 0.44,
    // 运行时 Phaser 圆环颜色（原创程序绘制）。
    ringColor: 0xffe89a,
    // 选中环线宽相对单格尺寸的比例。
    ringWidthRatio: 0.055,
    // 选中环透明度。
    ringAlpha: 0.95,
    // 普通宝石渲染层级。
    gemDepth: 3,
    // 选中宝石和选中环渲染层级。
    selectedDepth: 5,
  },
  skin: {
    // 页面、Canvas 和图片未覆盖区域的底色。
    backgroundColor: '#20120d',
    gameBackground: {
      // 全屏房间背景 texture key。
      textureKey: 'scene1-background',
      // 全屏房间背景 URL。
      imageUrl: '/scene1/images/background.webp',
      // 背景使用 cover：等比缩放、居中裁切，不拉伸。
      fit: 'cover' as const,
      // 全屏背景位于所有对象之后。
      depth: 0,
    },
    gems: [
      {
        textureKey: 'scene1-gem-purple',
        imageUrl: '/scene1/images/gem-purple.webp',
      },
      {
        textureKey: 'scene1-gem-orange',
        imageUrl: '/scene1/images/gem-orange.webp',
      },
      {
        textureKey: 'scene1-gem-heart',
        imageUrl: '/scene1/images/gem-heart.webp',
      },
      {
        textureKey: 'scene1-gem-green',
        imageUrl: '/scene1/images/gem-green.webp',
      },
    ],
    // 宝石和 KeyCell 在单格内的最大尺寸比例，保持原始纵横比。
    cellArtScale: 0.94,
    boomEffect: {
      // 消除中心 texture key。
      textureKey: 'scene1-boom',
      // 消除中心 URL。
      imageUrl: '/scene1/images/boom.png',
      // 效果初始尺寸相对单格的比例。
      startScale: 0.18,
      // 效果最大尺寸相对单格的比例。
      endScale: 0.92,
      // 放大和淡出的总时长（毫秒）。
      duration: 260,
      // 消除特效绘制在宝石之上。
      depth: 7,
    },
  },
  ui: {
    depth: {
      // 生命栏、展示台、猫咪和提示的默认 UI 层级。
      normal: 8,
      // 音频按钮层级，确保永远可操作。
      controls: 20,
      // 结算遮罩层级。
      outcomeMask: 30,
      // 结算主图和重开按钮层级。
      outcome: 31,
    },
    lifePanel: {
      textureKey: 'scene1-life-panel',
      imageUrl: '/scene1/images/life-panel.webp',
      // 面板最大显示宽度。
      maxWidth: 390,
      // 面板宽度相对棋盘宽度的比例。
      boardWidthRatio: 0.72,
      // 心形在面板高度中的占比。
      heartHeightRatio: 0.54,
      heartTextureKey: 'scene1-heart',
      heartImageUrl: '/scene1/images/heart.webp',
      brokenHeartTextureKey: 'scene1-heart-broken',
      brokenHeartImageUrl: '/scene1/images/heart-broken.webp',
    },
    targets: {
      standTextureKey: 'scene1-key-stand',
      standImageUrl: '/scene1/images/key-stand.webp',
      // 展示台最大显示宽度。
      standMaxWidth: 410,
      // 展示台宽度相对棋盘宽度的比例。
      standBoardWidthRatio: 0.76,
      promptTextureKey: 'scene1-collect-them',
      promptImageUrl: '/scene1/images/collect-them.webp',
      // Collect them 提示相对展示台高度的比例。
      promptHeightRatio: 0.38,
      // 桌面端提示相对展示台左缘向右的视觉校正比例；展示台纹理带透明边缘。
      promptDesktopShiftRatio: 0.058,
      // 提示铭牌填充色（原创 Phaser 图形），提升深色文字对比度。
      promptPanelFillColor: 0xffefd2,
      // 提示铭牌描边色。
      promptPanelStrokeColor: 0xb56a31,
      // 提示铭牌不透明度。
      promptPanelAlpha: 0.94,
      checkTextureKey: 'scene1-check',
      checkImageUrl: '/scene1/images/check.png',
      // 已收集勾选标记相对展示台高度的比例。
      checkHeightRatio: 0.22,
    },
    character: {
      treeTextureKey: 'scene1-cat-tree',
      treeImageUrl: '/scene1/images/cat-tree.webp',
      idleATextureKey: 'scene1-cat-idle-a',
      idleAImageUrl: '/scene1/images/cat-idle-a.webp',
      idleBTextureKey: 'scene1-cat-idle-b',
      idleBImageUrl: '/scene1/images/cat-idle-b.webp',
      keyTextureKey: 'scene1-cat-key',
      keyImageUrl: '/scene1/images/cat-key.webp',
      winTextureKey: 'scene1-cat-win',
      winImageUrl: '/scene1/images/cat-win.webp',
      // 宽屏猫爬架高度相对棋盘高度的上限。
      treeBoardHeightRatio: 1.04,
      // 宽屏猫咪高度相对单格尺寸。
      wideCatGemRatio: 2.35,
      // 窄屏右上角猫咪高度相对顶部保留区。
      compactCatTopRatio: 0.78,
      // 猫咪反馈弹跳高度相对单格尺寸。
      bounceGemRatio: 0.12,
      // 单次猫咪状态反馈保持时间（毫秒）。
      feedbackDuration: 1200,
      bubbleTextureKey: 'scene1-speech-bubble',
      bubbleImageUrl: '/scene1/images/speech-bubble.webp',
      meowTextureKey: 'scene1-meow',
      meowImageUrl: '/scene1/images/meow.webp',
    },
    hint: {
      textureKey: 'scene1-hand-guide',
      imageUrl: '/scene1/images/hand-guide.webp',
      // 首次无操作多久后显示真实可行交换提示。
      delay: 1700,
      // 手指高度相对单格尺寸。
      gemHeightRatio: 1.45,
      // 手指沿建议交换方向移动的距离相对单格尺寸。
      travelGemRatio: 0.62,
      // 单次往返动画时长。
      duration: 720,
    },
    score: {
      // 分数文字颜色（原创 Phaser Text）。
      color: '#fff4d5',
      // 分数描边颜色。
      stroke: '#5a1d14',
      // 分数描边宽度。
      strokeThickness: 4,
      // 字体族只使用浏览器本地通用字体，不加载外部字体。
      fontFamily: 'Georgia, serif',
      // 桌面分数最大字号。
      maxFontSize: 22,
      // 分数在生命面板内的垂直锚点，避开面板下沿和棋盘边框。
      panelYRatio: 0.3,
    },
    combo: {
      // 连击文字颜色（原创 Phaser Text）。
      color: '#fff0a8',
      // 连击描边颜色。
      stroke: '#6c1a26',
      // 连击显示时长。
      duration: 760,
      // 连击文字在棋盘中心上浮的距离（单格比例）。
      riseGemRatio: 0.9,
    },
    outcome: {
      maskTextureKey: 'scene1-outcome-mask',
      maskImageUrl: '/scene1/images/outcome-mask.webp',
      // 结算主图最多占较短视口边的比例。
      maxViewportCoverage: 0.62,
      // 结算主图弹入前的相对缩放。
      initialScale: 0.12,
      // 结算主图弹入时长。
      popDuration: 320,
      // “再玩一次”按钮填充色（原创 Phaser 图形）。
      restartFillColor: 0x6e1f32,
      // “再玩一次”按钮描边色。
      restartStrokeColor: 0xffd87d,
      // 按钮文字色。
      restartTextColor: '#fff4d5',
    },
  },
  backgroundMusic: {
    // BGM 的 Phaser audio key。
    textureKey: 'scene1-bgm',
    // BGM URL。
    audioUrl: '/scene1/audio/bgm.mp3',
    // 首次点击/触摸后自动启动音频。
    startOnFirstPointerDown: true,
    // BGM 音量。
    volume: 0.32,
    // 音频开启按钮 texture key / URL。
    playingTextureKey: 'scene1-music-on',
    playingImageUrl: '/scene1/images/music-on.png',
    // 音频关闭按钮 texture key / URL。
    pausedTextureKey: 'scene1-music-off',
    pausedImageUrl: '/scene1/images/music-off.png',
    // 按钮显示尺寸。
    buttonSize: 52,
    // 按钮距视口顶/右边缘的安全距离。
    buttonMargin: 12,
  },
  soundEffects: {
    click: {
      textureKey: 'scene1-click',
      audioUrl: '/scene1/audio/click.mp3',
      volume: 0.62,
    },
    swap: {
      textureKey: 'scene1-swap',
      audioUrl: '/scene1/audio/swap.mp3',
      volume: 0.66,
    },
    match: {
      textureKey: 'scene1-match',
      audioUrl: '/scene1/audio/match.mp3',
      volume: 0.64,
    },
    matchBig: {
      textureKey: 'scene1-match-big',
      audioUrl: '/scene1/audio/match-big.mp3',
      volume: 0.72,
    },
    cascade: {
      textureKey: 'scene1-cascade',
      audioUrl: '/scene1/audio/cascade.mp3',
      volume: 0.58,
    },
    boom: {
      textureKey: 'scene1-boom-sound',
      audioUrl: '/scene1/audio/boom.mp3',
      volume: 0.58,
    },
    fail: {
      textureKey: 'scene1-fail-sound',
      audioUrl: '/scene1/audio/fail.mp3',
      volume: 0.78,
    },
    successMeow: {
      textureKey: 'scene1-success-meow',
      audioUrl: '/scene1/audio/success-meow.mp3',
      volume: 0.76,
    },
    successClap: {
      textureKey: 'scene1-success-clap',
      audioUrl: '/scene1/audio/success-clap.mp3',
      volume: 0.66,
    },
    purr: {
      textureKey: 'scene1-purr',
      audioUrl: '/scene1/audio/purr.mp3',
      volume: 0.32,
    },
  },
  idleFeedback: {
    // 首次用户交互后，空闲多久开始猫咪呼噜（毫秒）。
    delay: 7000,
  },
  phaser: {
    // Phaser Canvas 挂载容器。
    parent: 'app',
    // Phaser 启动标题。
    title: 'Match 3 · The Cat Room',
    // 缩放 Scene1 位图时启用平滑过滤。
    antialias: true,
    // 保留亚像素坐标，避免响应式布局抖动。
    roundPixels: false,
  },
} as const;

/** Scene class 可用后创建 Phaser 4 配置。 */
export function createPhaserGameConfig(
  scene: Phaser.Types.Scenes.SceneType,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    title: GAME_CONFIG.phaser.title,
    backgroundColor: GAME_CONFIG.skin.backgroundColor,
    scale: {
      parent: GAME_CONFIG.phaser.parent,
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
    },
    render: {
      antialias: GAME_CONFIG.phaser.antialias,
      roundPixels: GAME_CONFIG.phaser.roundPixels,
    },
    scene,
  };
}
