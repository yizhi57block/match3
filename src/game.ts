import Phaser from 'phaser';
import {
  GAME_CONFIG,
  createPhaserGameConfig,
} from './game_config';

type MatchDirection = 'horizontal' | 'vertical';
type GameOutcome = 'playing' | 'won' | 'failed';

interface GemCell {
  kind: 'gem';
  gemColor: number;
  gemImage: Phaser.GameObjects.Image;
  isEmpty: boolean;
}

interface KeyCell {
  kind: 'key';
  keyId: string;
  gemImage: Phaser.GameObjects.Image;
  isEmpty: boolean;
}

type BoardCell = GemCell | KeyCell;

export class Match3Scene extends Phaser.Scene {
  private gameArray: BoardCell[][] = [];
  private poolArray: Phaser.GameObjects.Image[] = [];
  private removeMap: number[][] = [];
  private selectedGem: GemCell | null = null;
  private canPick = true;
  private dragging = false;
  private swappingGems = 0;
  private backgroundMusic: Phaser.Sound.BaseSound | null = null;
  private musicStatusButton: Phaser.GameObjects.Image | null = null;
  private hasHandledMusicAutoStart = false;
  private boardOriginX = 0;
  private boardOriginY = 0;
  private gemSize: number = GAME_CONFIG.layout.maxGemSize;
  private pendingBoardLayout = false;
  /**
   * Screen rectangle covered by the board's decorated outer frame, including
   * its border. Side decorations clamp against this so they never overlap a
   * playable cell, and the frame itself is kept inside the viewport.
   */
  private boardFrame = { x: 0, y: 0, width: 0, height: 0 };
  /** Fitted display height of the cat, reapplied whenever its texture swaps. */
  private catTargetHeight = 0;
  /** Whether the current layout has room to show the cat at all. */
  private catVisible = true;
  private wrongMoveCount = 0;
  private gameOutcome: GameOutcome = 'playing';
  private collectedKeyCount = 0;
  private gameFailTimer: Phaser.Time.TimerEvent | null = null;
  private gameOutcomeImage: Phaser.GameObjects.Image | null = null;
  private sceneBackground: Phaser.GameObjects.Image | null = null;
  private gameBoardImage: Phaser.GameObjects.Image | null = null;
  private catCharacter: Phaser.GameObjects.Image | null = null;
  private catTower: Phaser.GameObjects.Image | null = null;
  private displayTable: Phaser.GameObjects.Image | null = null;
  private collectedKeyIcons: Phaser.GameObjects.Image[] = [];
  private idleSnoreSound: Phaser.Sound.BaseSound | null = null;
  private idleTimer: Phaser.Time.TimerEvent | null = null;
  private lastInteractionTime = 0;

  constructor() {
    super('Match3');
  }

  init(): void {
    this.gameArray = [];
    this.poolArray = [];
    this.removeMap = [];
    this.selectedGem = null;
    this.canPick = true;
    this.dragging = false;
    this.swappingGems = 0;
    this.backgroundMusic = null;
    this.musicStatusButton = null;
    this.hasHandledMusicAutoStart = false;
    this.boardOriginX = 0;
    this.boardOriginY = 0;
    this.gemSize = GAME_CONFIG.layout.maxGemSize;
    this.pendingBoardLayout = false;
    this.boardFrame = { x: 0, y: 0, width: 0, height: 0 };
    this.catTargetHeight = 0;
    this.catVisible = true;
    this.wrongMoveCount = 0;
    this.gameOutcome = 'playing';
    this.collectedKeyCount = 0;
    this.gameFailTimer = null;
    this.gameOutcomeImage = null;
    this.sceneBackground = null;
    this.gameBoardImage = null;
    this.catCharacter = null;
    this.catTower = null;
    this.displayTable = null;
    this.collectedKeyIcons = [];
    this.idleSnoreSound = null;
    this.idleTimer = null;
    this.lastInteractionTime = 0;
  }

  preload(): void {
    // 加载宝石精灵图
    this.load.spritesheet(
      GAME_CONFIG.skin.gems.textureKey,
      GAME_CONFIG.skin.gems.spritesheetUrl,
      {
        frameWidth: GAME_CONFIG.skin.gems.frameWidth,
        frameHeight: GAME_CONFIG.skin.gems.frameHeight,
      },
    );

    // 加载场景背景资源
    if (GAME_CONFIG.skin.background) {
      this.load.image(
        GAME_CONFIG.skin.background.textureKey,
        GAME_CONFIG.skin.background.imageUrl,
      );
    }

    // 加载棋盘背景
    if (GAME_CONFIG.skin.board) {
      this.load.image(
        GAME_CONFIG.skin.board.textureKey,
        GAME_CONFIG.skin.board.imageUrl,
      );
    }

    // 加载猫咪角色状态
    this.load.image('cat-idle', '/scene1/cat/cat_idle.webp');
    this.load.image('cat-idle2', '/scene1/cat/cat_idle2.webp');
    this.load.image('cat-licking', '/scene1/cat/cat_licking.webp');
    this.load.image('cat-happy', '/scene1/cat/cat_happy.webp');

    // 加载UI装饰
    this.load.image('cat-tower', '/scene1/ui/cat_tower.webp');
    this.load.image('display-table', '/scene1/ui/display_table.webp');
    this.load.image('collect-text', '/scene1/ui/collect_text.webp');

    // 加载背景音乐和音效
    this.load.audio(
      GAME_CONFIG.backgroundMusic.textureKey,
      GAME_CONFIG.backgroundMusic.audioUrl,
    );
    this.load.audio('snore-sound', '/scene1/audio/snore.mp3');

    for (const soundEffect of Object.values(GAME_CONFIG.soundEffects)) {
      this.load.audio(soundEffect.textureKey, soundEffect.audioUrl);
    }

    // 加载音乐控制按钮
    this.load.image(
      'background-music-playing',
      GAME_CONFIG.backgroundMusic.playingImageUrl,
    );
    this.load.image(
      'background-music-paused',
      GAME_CONFIG.backgroundMusic.pausedImageUrl,
    );

    // 加载成功/失败画面
    this.load.image(
      GAME_CONFIG.failureConditions.failImage.textureKey,
      GAME_CONFIG.failureConditions.failImage.imageUrl,
    );
    this.load.image(
      GAME_CONFIG.victoryCondition.successImage.textureKey,
      GAME_CONFIG.victoryCondition.successImage.imageUrl,
    );

    // 加载关键道具
    for (const keyAsset of GAME_CONFIG.victoryCondition.keys) {
      this.load.image(keyAsset.textureKey, keyAsset.imageUrl);
    }
  }

  create(): void {
    this.createSceneBackground();
    this.createSceneDecorations();
    // The board frame rectangle must exist before decorations can clamp
    // themselves into the margins beside it.
    this.updateBoardLayout();
    this.updateSceneDecorationsLayout();
    this.drawField();
    this.createBackgroundMusicControls();
    this.createIdleSystem();
    this.startFailureCountdown();

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.gemSelect, this);
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      this.startBackgroundMusicOnFirstPointerDown,
      this,
    );
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      this.recordInteraction,
      this,
    );
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.startSwipe, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.stopSwipe, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.gemSelect, this);
      this.input.off(
        Phaser.Input.Events.POINTER_DOWN,
        this.startBackgroundMusicOnFirstPointerDown,
        this,
      );
      this.input.off(
        Phaser.Input.Events.POINTER_DOWN,
        this.recordInteraction,
        this,
      );
      this.input.off(Phaser.Input.Events.POINTER_MOVE, this.startSwipe, this);
      this.input.off(Phaser.Input.Events.POINTER_UP, this.stopSwipe, this);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.backgroundMusic?.stop();
      this.backgroundMusic?.destroy();
      this.backgroundMusic = null;
      this.idleSnoreSound?.stop();
      this.idleSnoreSound?.destroy();
      this.idleSnoreSound = null;
      this.idleTimer?.remove();
      this.idleTimer = null;
      this.musicStatusButton = null;
      this.gameFailTimer?.remove();
      this.gameFailTimer = null;
      this.gameOutcomeImage = null;
      this.sceneBackground = null;
      this.gameBoardImage = null;
      this.catCharacter = null;
      this.catTower = null;
      this.displayTable = null;
      this.collectedKeyIcons = [];
      this.gameArray = [];
      this.poolArray = [];
      this.removeMap = [];
      this.selectedGem = null;
    });
  }

  private createSceneBackground(): void {
    // 创建全屏背景
    if (GAME_CONFIG.skin.background) {
      this.sceneBackground = this.add
        .image(0, 0, GAME_CONFIG.skin.background.textureKey)
        .setOrigin(0, 0)
        .setDepth(GAME_CONFIG.depths.sceneBackground);
      this.updateSceneBackgroundSize();
    }

    // 创建棋盘背景图。它的层级高于所有装饰物，保证外框永不被遮挡。
    if (GAME_CONFIG.skin.board) {
      this.gameBoardImage = this.add
        .image(0, 0, GAME_CONFIG.skin.board.textureKey)
        .setOrigin(0, 0)
        .setDepth(GAME_CONFIG.depths.boardFrame);
    }
  }

  private updateSceneBackgroundSize(): void {
    if (!this.sceneBackground) return;

    const source = this.textures
      .get(GAME_CONFIG.skin.background!.textureKey)
      .getSourceImage();
    const scaleX = this.scale.width / source.width;
    const scaleY = this.scale.height / source.height;
    const scale = Math.max(scaleX, scaleY);

    this.sceneBackground
      .setScale(scale)
      .setPosition(
        (this.scale.width - source.width * scale) / 2,
        (this.scale.height - source.height * scale) / 2,
      );
  }

  private createSceneDecorations(): void {
    const { depths } = GAME_CONFIG;

    // 创建猫爬架（宽屏时位于棋盘右侧留白）
    this.catTower = this.add
      .image(0, 0, 'cat-tower')
      .setOrigin(0.5, 1)
      .setDepth(depths.backDecoration);

    // 创建展示台长凳（宽屏时位于棋盘左侧留白，窄屏时移到棋盘下方）
    this.displayTable = this.add
      .image(0, 0, 'display-table')
      .setOrigin(0.5, 1)
      .setDepth(depths.backDecoration);

    // 创建猫咪角色（初始状态：空闲）
    this.catCharacter = this.add
      .image(0, 0, 'cat-idle')
      .setOrigin(0.5, 1)
      .setDepth(depths.frontDecoration);

    // 初始布局由 create() 在棋盘外框计算完成后统一调用。
  }

  /**
   * Places the flanking decorations relative to the current board frame.
   *
   * Wide viewports use the margins beside the frame. When those margins get
   * too narrow the bench moves below the board and the cat peeks above it, so
   * a decoration can never cover the frame or a playable cell.
   */
  private updateSceneDecorationsLayout(): void {
    const { screenMargin, boardGap, minSideBandWidth } = GAME_CONFIG.decorations;
    const frame = this.boardFrame;

    const leftBandWidth = frame.x - boardGap - screenMargin;
    const rightBandWidth =
      this.scale.width - (frame.x + frame.width) - boardGap - screenMargin;
    const bandHeight = this.scale.height - screenMargin * 2;
    const useSideBands =
      Math.min(leftBandWidth, rightBandWidth) >= minSideBandWidth;

    this.updateDisplayTableLayout(useSideBands, leftBandWidth, bandHeight);
    this.updateCatTowerLayout(useSideBands, rightBandWidth, bandHeight);
    this.layoutCollectedKeyIcons(true);
  }

  /**
   * Largest uniform scale that fits an image inside the given band without
   * upscaling past its native size. Returns null when the band has no usable
   * room, meaning the caller should hide the decoration entirely.
   */
  private fitDecorationScale(
    image: Phaser.GameObjects.Image,
    bandWidth: number,
    bandHeight: number,
  ): number | null {
    if (bandWidth <= 0 || bandHeight <= 0) {
      return null;
    }

    const source = this.textures.get(image.texture.key).getSourceImage();
    const scale = Math.min(
      bandWidth / source.width,
      bandHeight / source.height,
      1,
    );

    return scale < GAME_CONFIG.decorations.minScale ? null : scale;
  }

  private updateDisplayTableLayout(
    useSideBands: boolean,
    leftBandWidth: number,
    bandHeight: number,
  ): void {
    if (!this.displayTable) return;

    const { screenMargin, boardGap } = GAME_CONFIG.decorations;
    const frame = this.boardFrame;

    // 宽屏：长凳完整落在棋盘左侧留白内；窄屏：改用棋盘下方的横向留白。
    const band = useSideBands
      ? { width: leftBandWidth, height: bandHeight * 0.5 }
      : {
          width: this.scale.width - screenMargin * 2,
          height:
            this.scale.height -
            (frame.y + frame.height) -
            boardGap -
            screenMargin,
        };
    const scale = this.fitDecorationScale(
      this.displayTable,
      band.width,
      band.height,
    );

    if (scale === null) {
      this.displayTable.setVisible(false);
      return;
    }

    this.displayTable.setVisible(true).setScale(scale);
    this.displayTable.setPosition(
      useSideBands
        ? screenMargin + this.displayTable.displayWidth / 2
        : this.scale.width / 2,
      this.scale.height - screenMargin,
    );
  }

  private updateCatTowerLayout(
    useSideBands: boolean,
    rightBandWidth: number,
    bandHeight: number,
  ): void {
    if (!this.catTower || !this.catCharacter) return;

    const {
      screenMargin,
      boardGap,
      catPerchRatio,
      catHeightRatio,
      catCompactMaxHeight,
    } = GAME_CONFIG.decorations;
    const towerScale = useSideBands
      ? this.fitDecorationScale(this.catTower, rightBandWidth, bandHeight)
      : null;

    if (towerScale !== null) {
      this.catTower.setVisible(true).setScale(towerScale);
      const towerX =
        this.scale.width - screenMargin - this.catTower.displayWidth / 2;
      const towerBottom = this.scale.height - screenMargin;
      this.catTower.setPosition(towerX, towerBottom);

      // 猫咪坐在爬架平台上，落点与尺寸随爬架显示高度等比缩放。
      this.catVisible = true;
      this.catTargetHeight = this.catTower.displayHeight * catHeightRatio;
      this.catCharacter.setVisible(true);
      this.applyCatFittedSize();
      this.catCharacter.setPosition(
        towerX,
        towerBottom - this.catTower.displayHeight * (1 - catPerchRatio),
      );
      return;
    }

    // 窄屏：隐藏爬架，让猫咪单独出现在棋盘上方的留白里。
    this.catTower.setVisible(false);

    const topBandHeight = this.boardFrame.y - boardGap - screenMargin;
    const catHeight = Math.min(topBandHeight, catCompactMaxHeight);

    if (catHeight < 1) {
      this.catVisible = false;
      this.catCharacter.setVisible(false);
      return;
    }

    this.catVisible = true;
    this.catTargetHeight = catHeight;
    this.catCharacter.setVisible(true);
    this.applyCatFittedSize();
    this.catCharacter.setPosition(this.scale.width / 2, screenMargin + catHeight);
  }

  /**
   * Reapplies the layout's fitted cat height. The idle/licking/happy textures
   * differ slightly in size, so this keeps the cat visually stable on swaps.
   */
  private applyCatFittedSize(): void {
    if (!this.catCharacter || !this.catVisible || this.catTargetHeight <= 0) {
      return;
    }

    const source = this.textures
      .get(this.catCharacter.texture.key)
      .getSourceImage();
    this.catCharacter.setScale(this.catTargetHeight / source.height);
  }

  private updateCatState(state: 'idle' | 'licking' | 'happy'): void {
    if (!this.catCharacter) return;

    const textureMap = {
      idle: Math.random() > 0.5 ? 'cat-idle' : 'cat-idle2',
      licking: 'cat-licking',
      happy: 'cat-happy',
    };

    this.catCharacter.setTexture(textureMap[state]);
    // Textures differ in native size; keep the layout's fitted height.
    this.applyCatFittedSize();
  }

  private createIdleSystem(): void {
    // 创建空闲打呼噜音效
    this.idleSnoreSound = this.sound.add('snore-sound', {
      loop: true,
      volume: 0.3,
    });

    // 启动空闲检测定时器（每3秒检查一次）
    this.idleTimer = this.time.addEvent({
      delay: 3000,
      callback: this.checkIdleState,
      callbackScope: this,
      loop: true,
    });

    this.lastInteractionTime = Date.now();
  }

  private checkIdleState(): void {
    const idleTime = Date.now() - this.lastInteractionTime;
    const idleThreshold = 10000; // 10秒无操作视为空闲

    if (idleTime > idleThreshold && this.gameOutcome === 'playing') {
      // 播放呼噜声
      if (this.idleSnoreSound && !this.idleSnoreSound.isPlaying) {
        this.idleSnoreSound.play();
      }
    } else {
      // 停止呼噜声
      if (this.idleSnoreSound?.isPlaying) {
        this.idleSnoreSound.stop();
      }
    }
  }

  private recordInteraction(): void {
    this.lastInteractionTime = Date.now();
    if (this.idleSnoreSound?.isPlaying) {
      this.idleSnoreSound.stop();
    }
  }

  private createBackgroundMusicControls(): void {
    this.backgroundMusic = this.sound.add(
      GAME_CONFIG.backgroundMusic.textureKey,
      {
        loop: true,
        volume: GAME_CONFIG.backgroundMusic.volume,
      },
    );

    const { buttonMargin, buttonSize } = GAME_CONFIG.backgroundMusic;
    this.musicStatusButton = this.add
      .image(
        this.scale.width - buttonMargin - buttonSize / 2,
        buttonMargin + buttonSize / 2,
        'background-music-paused',
      )
      .setDisplaySize(buttonSize, buttonSize)
      .setDepth(GAME_CONFIG.depths.ui)
      .setInteractive({ useHandCursor: true });
    this.musicStatusButton.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        this.toggleBackgroundMusic();
      },
    );
  }

  private handleResize(): void {
    this.updateSceneBackgroundSize();

    if (this.gameOutcome !== 'playing') {
      // The board keeps its resolved frame after the game ends; only reflow the
      // decorations and overlays around it.
      this.updateSceneDecorationsLayout();
      this.updateGameOutcomeImagePosition();
      this.updateMusicStatusButtonPosition();
      return;
    }

    if (this.canPick) {
      // Recompute the board frame first so decorations clamp against it.
      this.updateBoardLayout(true);
    } else {
      // Do not move targets while a swap or cascade tween is resolving. The
      // board frame is unchanged, so decorations still clamp correctly.
      this.pendingBoardLayout = true;
    }
    this.updateSceneDecorationsLayout();
    this.updateMusicStatusButtonPosition();
  }

  private startFailureCountdown(): void {
    const { countdownSeconds } = GAME_CONFIG.failureConditions;

    if (countdownSeconds <= 0) {
      return;
    }

    this.gameFailTimer = this.time.delayedCall(
      countdownSeconds * 1000,
      this.triggerGameFail,
      [],
      this,
    );
  }

  private registerWrongMove(): boolean {
    const { allowedWrongMoves } = GAME_CONFIG.failureConditions;

    if (allowedWrongMoves <= 0) {
      return false;
    }

    this.wrongMoveCount += 1;
    if (this.wrongMoveCount < allowedWrongMoves) {
      return false;
    }

    this.triggerGameFail();
    return true;
  }

  private triggerGameFail(): void {
    if (this.gameOutcome !== 'playing') {
      return;
    }

    this.gameOutcome = 'failed';
    this.finishGame();
    this.playSoundEffect('gameFail');
    this.showGameOutcomeImage(
      GAME_CONFIG.failureConditions.failImage.textureKey,
    );
  }

  private triggerGameSuccess(): void {
    if (this.gameOutcome !== 'playing') {
      return;
    }

    this.gameOutcome = 'won';
    this.finishGame();

    // 猫咪开心状态
    this.updateCatState('happy');

    // 播放胜利音效
    this.playSoundEffect('victory');
    this.time.delayedCall(1000, () => {
      this.playSoundEffect('applause');
    });

    this.showGameOutcomeImage(
      GAME_CONFIG.victoryCondition.successImage.textureKey,
    );
  }

  private finishGame(): void {
    this.canPick = false;
    this.dragging = false;
    this.pendingBoardLayout = false;
    this.clearSelection();
    this.gameFailTimer?.remove();
    this.gameFailTimer = null;
    this.idleTimer?.remove();
    this.idleTimer = null;
    this.idleSnoreSound?.stop();
    this.tweens.killAll();
  }

  private showGameOutcomeImage(textureKey: string): void {
    const { initialScale, popDuration } = GAME_CONFIG.outcomePopup;
    const finalScale = this.resolveGameOutcomeImageScale(textureKey);

    this.gameOutcomeImage = this.add
      .image(
        this.scale.width / 2,
        this.scale.height / 2,
        textureKey,
      )
      .setDepth(GAME_CONFIG.depths.outcomePopup)
      .setScale(finalScale * initialScale);

    this.tweens.add({
      targets: this.gameOutcomeImage,
      scaleX: finalScale,
      scaleY: finalScale,
      duration: popDuration,
      ease: 'Back.easeOut',
    });
  }

  private resolveGameOutcomeImageScale(textureKey: string): number {
    const { maxViewportCoverage } = GAME_CONFIG.outcomePopup;
    const source = this.textures.get(textureKey).getSourceImage();

    return Math.min(
      (this.scale.width * maxViewportCoverage) / source.width,
      (this.scale.height * maxViewportCoverage) / source.height,
    );
  }

  private updateGameOutcomeImagePosition(): void {
    this.gameOutcomeImage?.setPosition(
      this.scale.width / 2,
      this.scale.height / 2,
    );
  }

  private updateBoardLayout(moveGems = false): void {
    const { position } = GAME_CONFIG.board;
    this.gemSize = this.resolveGemSize();

    const boardWidth = GAME_CONFIG.fieldSize.width * this.gemSize;
    const boardHeight = GAME_CONFIG.fieldSize.height * this.gemSize;

    if (GAME_CONFIG.skin.board && this.gameBoardImage) {
      const boardPadding = GAME_CONFIG.skin.board.padding;
      const source = this.textures
        .get(GAME_CONFIG.skin.board.textureKey)
        .getSourceImage();

      // 每个轴单独缩放，让图片的可用区域精确覆盖逻辑棋盘边界。
      // 装饰边框的宽高比差异不足 2%，肉眼不可见，但能保证格子精确对齐。
      const contentWidth =
        source.width - boardPadding.left - boardPadding.right;
      const contentHeight =
        source.height - boardPadding.top - boardPadding.bottom;
      const scaleX = boardWidth / contentWidth;
      const scaleY = boardHeight / contentHeight;

      this.gameBoardImage.setScale(scaleX, scaleY);

      // 边框在缩放后的实际厚度。
      const borderLeft = boardPadding.left * scaleX;
      const borderRight = boardPadding.right * scaleX;
      const borderTop = boardPadding.top * scaleY;
      const borderBottom = boardPadding.bottom * scaleY;
      const frameWidth = boardWidth + borderLeft + borderRight;
      const frameHeight = boardHeight + borderTop + borderBottom;

      // 居中时以「含边框的完整外框」为基准，避免顶部/底部卷饰被裁切。
      const frameX =
        position.x === 'center'
          ? (this.scale.width - frameWidth) / 2
          : position.x - borderLeft;
      const frameY =
        position.y === 'center'
          ? (this.scale.height - frameHeight) / 2
          : position.y - borderTop;

      this.gameBoardImage.setPosition(frameX, frameY);

      this.boardOriginX = frameX + borderLeft;
      this.boardOriginY = frameY + borderTop;
      this.boardFrame = {
        x: frameX,
        y: frameY,
        width: frameWidth,
        height: frameHeight,
      };
    } else {
      this.boardOriginX = this.resolveBoardPosition(
        position.x,
        boardWidth,
        this.scale.width,
      );
      this.boardOriginY = this.resolveBoardPosition(
        position.y,
        boardHeight,
        this.scale.height,
      );
      this.boardFrame = {
        x: this.boardOriginX,
        y: this.boardOriginY,
        width: boardWidth,
        height: boardHeight,
      };
    }

    if (!moveGems || this.gameArray.length === 0) {
      return;
    }

    for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
      for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
        const cell = this.gameArray[row][col];
        cell.gemImage.setPosition(this.toPixel(col), this.toPixelY(row));
        this.restoreGemDisplay(cell.gemImage);
      }
    }

    if (this.selectedGem !== null) {
      this.selectGem(this.selectedGem);
    }
  }

  private resolveGemSize(): number {
    const { fieldSize, layout, selection } = GAME_CONFIG;
    const selectionOverflow = selection.enlargeOnSelect
      ? Math.max(selection.scale - 1, 0)
      : 0;
    const availableWidth = Math.max(
      0,
      this.scale.width - layout.horizontalPadding * 2,
    );
    const availableHeight = Math.max(
      0,
      this.scale.height - layout.verticalPadding * 2,
    );

    // The board frame's border scales with the cells, so its thickness has to
    // be part of the size budget or the decorated frame overflows the viewport.
    // A selected boundary gem also grows outward; reserve whichever is larger.
    const frameUnits = this.resolveBoardFrameUnits();
    const widthUnits =
      fieldSize.width + Math.max(frameUnits.horizontal, selectionOverflow);
    const heightUnits =
      fieldSize.height + Math.max(frameUnits.vertical, selectionOverflow);

    return Phaser.Math.Clamp(
      Math.min(availableWidth / widthUnits, availableHeight / heightUnits),
      layout.minGemSize,
      layout.maxGemSize,
    );
  }

  /**
   * Thickness of the board frame's decorative border, expressed in gem-size
   * units so it can be folded into the gem size budget before a size exists.
   *
   * Because each axis of the frame is scaled to map its content region onto the
   * logical board, the border on that axis always scales with the cell size:
   * `border = padding * (board / content)`, i.e. a constant multiple of the gem
   * size. Returns zero units when no board frame image is configured.
   */
  private resolveBoardFrameUnits(): { horizontal: number; vertical: number } {
    if (!GAME_CONFIG.skin.board || !this.gameBoardImage) {
      return { horizontal: 0, vertical: 0 };
    }

    const { padding, textureKey } = GAME_CONFIG.skin.board;
    const source = this.textures.get(textureKey).getSourceImage();
    const contentWidth = source.width - padding.left - padding.right;
    const contentHeight = source.height - padding.top - padding.bottom;

    if (contentWidth <= 0 || contentHeight <= 0) {
      return { horizontal: 0, vertical: 0 };
    }

    return {
      horizontal:
        ((padding.left + padding.right) * GAME_CONFIG.fieldSize.width) /
        contentWidth,
      vertical:
        ((padding.top + padding.bottom) * GAME_CONFIG.fieldSize.height) /
        contentHeight,
    };
  }

  private resolveBoardPosition(
    position: number | 'center',
    boardSize: number,
    canvasSize: number,
  ): number {
    return position === 'center' ? (canvasSize - boardSize) / 2 : position;
  }

  private updateMusicStatusButtonPosition(): void {
    const { buttonMargin, buttonSize } = GAME_CONFIG.backgroundMusic;
    this.musicStatusButton?.setPosition(
      this.scale.width - buttonMargin - buttonSize / 2,
      buttonMargin + buttonSize / 2,
    );
  }

  private startBackgroundMusicOnFirstPointerDown(): void {
    if (
      !GAME_CONFIG.backgroundMusic.startOnFirstPointerDown ||
      this.hasHandledMusicAutoStart
    ) {
      return;
    }

    this.hasHandledMusicAutoStart = true;
    this.playBackgroundMusic();
  }

  private toggleBackgroundMusic(): void {
    if (this.backgroundMusic?.isPlaying) {
      this.backgroundMusic.pause();
      this.updateMusicStatusButton();
      return;
    }

    this.playBackgroundMusic();
  }

  private playBackgroundMusic(): void {
    if (this.backgroundMusic === null || this.backgroundMusic.isPlaying) {
      return;
    }

    if (this.backgroundMusic.isPaused) {
      this.backgroundMusic.resume();
    } else {
      this.backgroundMusic.play();
    }
    this.updateMusicStatusButton();
  }

  private updateMusicStatusButton(): void {
    this.musicStatusButton?.setTexture(
      this.backgroundMusic?.isPlaying
        ? 'background-music-playing'
        : 'background-music-paused',
    );
  }

  private playSoundEffect(
    soundEffect: keyof typeof GAME_CONFIG.soundEffects,
  ): void {
    const { textureKey, volume } = GAME_CONFIG.soundEffects[soundEffect];
    this.sound.play(textureKey, { volume });
  }

  private drawField(): void {
    for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
      this.gameArray[row] = [];

      for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
        const gemImage = this.add.image(
          this.toPixel(col),
          this.toPixelY(row),
          GAME_CONFIG.skin.gems.textureKey,
          0,
        );
        this.restoreGemDisplay(gemImage);
        const cell: GemCell = {
          kind: 'gem',
          gemColor: 0,
          gemImage,
          isEmpty: false,
        };

        this.gameArray[row][col] = cell;

        do {
          cell.gemColor = Phaser.Math.Between(
            0,
            GAME_CONFIG.skin.gems.frameCount - 1,
          );
          gemImage.setFrame(cell.gemColor);
        } while (this.isMatch(row, col));
      }
    }

    this.placeVictoryKeys();
  }

  private placeVictoryKeys(): void {
    const availablePositions: Array<{ row: number; col: number }> = [];

    for (let row = 0; row < GAME_CONFIG.fieldSize.height - 1; row += 1) {
      for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
        availablePositions.push({ row, col });
      }
    }

    if (availablePositions.length < GAME_CONFIG.victoryCondition.keys.length) {
      throw new Error('The board does not have enough non-bottom key positions.');
    }

    for (const keyAsset of GAME_CONFIG.victoryCondition.keys) {
      const positionIndex = Phaser.Math.Between(
        0,
        availablePositions.length - 1,
      );
      const { row, col } = availablePositions.splice(positionIndex, 1)[0];
      const replacedGem = this.gameArray[row][col];

      replacedGem.gemImage.setVisible(false);
      this.poolArray.push(replacedGem.gemImage);

      const keyImage = this.add.image(
        this.toPixel(col),
        this.toPixelY(row),
        keyAsset.textureKey,
      );
      this.restoreGemDisplay(keyImage);
      this.gameArray[row][col] = {
        kind: 'key',
        keyId: keyAsset.textureKey,
        gemImage: keyImage,
        isEmpty: false,
      };
    }
  }

  private toPixel(gridPosition: number): number {
    return (
      this.boardOriginX +
      this.gemSize * gridPosition +
      this.gemSize / 2
    );
  }

  private toPixelY(gridPosition: number): number {
    return (
      this.boardOriginY +
      this.gemSize * gridPosition +
      this.gemSize / 2
    );
  }

  private isMatch(row: number, col: number): boolean {
    return this.isHorizontalMatch(row, col) || this.isVerticalMatch(row, col);
  }

  private isHorizontalMatch(row: number, col: number): boolean {
    const current = this.gemAt(row, col);
    const previous = this.gemAt(row, col - 1);
    const beforePrevious = this.gemAt(row, col - 2);

    return this.cellsShareColor(current, previous, beforePrevious);
  }

  private isVerticalMatch(row: number, col: number): boolean {
    const current = this.gemAt(row, col);
    const previous = this.gemAt(row - 1, col);
    const beforePrevious = this.gemAt(row - 2, col);

    return this.cellsShareColor(current, previous, beforePrevious);
  }

  private cellsShareColor(...cells: Array<BoardCell | null>): boolean {
    if (
      cells.some(
        (cell) => cell === null || cell.isEmpty || cell.kind !== 'gem',
      )
    ) {
      return false;
    }

    const [first, ...rest] = cells as GemCell[];
    return rest.every((cell) => cell.gemColor === first.gemColor);
  }

  private gemAt(row: number, col: number): BoardCell | null {
    if (
      row < 0 ||
      row >= GAME_CONFIG.fieldSize.height ||
      col < 0 ||
      col >= GAME_CONFIG.fieldSize.width
    ) {
      return null;
    }

    return this.gameArray[row]?.[col] ?? null;
  }

  private gemSelect(pointer: Phaser.Input.Pointer): void {
    if (!this.canPick) {
      return;
    }

    const row = Math.floor(
      (pointer.y - this.boardOriginY) / this.gemSize,
    );
    const col = Math.floor(
      (pointer.x - this.boardOriginX) / this.gemSize,
    );
    const pickedGem = this.gemAt(row, col);

    if (pickedGem === null || pickedGem.kind !== 'gem') {
      return;
    }

    this.playSoundEffect('click');
    this.dragging = true;

    if (this.selectedGem === null) {
      this.selectGem(pickedGem);
      return;
    }

    if (this.areTheSame(pickedGem, this.selectedGem)) {
      this.clearSelection();
      return;
    }

    if (this.areNext(pickedGem, this.selectedGem)) {
      this.restoreGemDisplay(this.selectedGem.gemImage);
      this.swapGems(this.selectedGem, pickedGem, true);
      return;
    }

    this.clearSelection();
    this.selectGem(pickedGem);
  }

  private selectGem(gem: GemCell): void {
    const selectionScale = GAME_CONFIG.selection.enlargeOnSelect
      ? GAME_CONFIG.selection.scale
      : 1;

    gem.gemImage
      .setDisplaySize(
        this.gemSize * selectionScale,
        this.gemSize * selectionScale,
      )
      .setDepth(GAME_CONFIG.selection.depth);
    this.selectedGem = gem;
  }

  private clearSelection(): void {
    if (this.selectedGem !== null) {
      this.restoreGemDisplay(this.selectedGem.gemImage);
    }
    this.selectedGem = null;
  }

  private restoreGemDisplay(gemImage: Phaser.GameObjects.Image): void {
    gemImage
      .setDisplaySize(this.gemSize, this.gemSize)
      .setDepth(GAME_CONFIG.depths.gem);
  }

  private startSwipe(pointer: Phaser.Input.Pointer): void {
    if (!this.canPick || !this.dragging || this.selectedGem === null) {
      return;
    }

    const deltaX = pointer.downX - pointer.x;
    const deltaY = pointer.downY - pointer.y;
    let deltaRow = 0;
    let deltaCol = 0;

    if (
      deltaX > this.gemSize * 0.35 &&
      Math.abs(deltaY) < this.gemSize * 0.45
    ) {
      deltaCol = -1;
    } else if (
      deltaX < -this.gemSize * 0.35 &&
      Math.abs(deltaY) < this.gemSize * 0.45
    ) {
      deltaCol = 1;
    } else if (
      deltaY > this.gemSize * 0.35 &&
      Math.abs(deltaX) < this.gemSize * 0.45
    ) {
      deltaRow = -1;
    } else if (
      deltaY < -this.gemSize * 0.35 &&
      Math.abs(deltaX) < this.gemSize * 0.45
    ) {
      deltaRow = 1;
    }

    if (deltaRow === 0 && deltaCol === 0) {
      return;
    }

    const selectedRow = this.getGemRow(this.selectedGem);
    const selectedCol = this.getGemCol(this.selectedGem);
    const pickedGem = this.gemAt(selectedRow + deltaRow, selectedCol + deltaCol);

    if (pickedGem?.kind === 'gem') {
      this.restoreGemDisplay(this.selectedGem.gemImage);
      this.dragging = false;
      this.swapGems(this.selectedGem, pickedGem, true);
    } else if (pickedGem?.kind === 'key') {
      this.dragging = false;
    }
  }

  private stopSwipe(): void {
    this.dragging = false;
  }

  private finishBoardInteraction(): void {
    if (this.gameOutcome !== 'playing') {
      return;
    }

    this.canPick = true;
    this.clearSelection();

    if (!this.pendingBoardLayout) {
      return;
    }

    this.pendingBoardLayout = false;
    this.updateBoardLayout(true);
    // The deferred resize may have changed the frame; reflow what clamps to it.
    this.updateSceneDecorationsLayout();
    this.updateMusicStatusButtonPosition();
  }

  private areTheSame(gem1: GemCell, gem2: GemCell): boolean {
    return (
      this.getGemRow(gem1) === this.getGemRow(gem2) &&
      this.getGemCol(gem1) === this.getGemCol(gem2)
    );
  }

  private getGemRow(gem: GemCell): number {
    return Math.floor(
      (gem.gemImage.y - this.boardOriginY) / this.gemSize,
    );
  }

  private getGemCol(gem: GemCell): number {
    return Math.floor(
      (gem.gemImage.x - this.boardOriginX) / this.gemSize,
    );
  }

  private areNext(gem1: GemCell, gem2: GemCell): boolean {
    return (
      Math.abs(this.getGemRow(gem1) - this.getGemRow(gem2)) +
        Math.abs(this.getGemCol(gem1) - this.getGemCol(gem2)) ===
      1
    );
  }

  private swapGems(gem1: GemCell, gem2: GemCell, swapBack: boolean): void {
    const gem1Row = this.getGemRow(gem1);
    const gem1Col = this.getGemCol(gem1);
    const gem2Row = this.getGemRow(gem2);
    const gem2Col = this.getGemCol(gem2);

    this.canPick = false;
    this.swappingGems = 2;

    // 播放交换音效
    if (swapBack) {
      this.playSoundEffect('swap');
    }

    this.gameArray[gem1Row][gem1Col] = {
      kind: 'gem',
      gemColor: gem2.gemColor,
      gemImage: gem2.gemImage,
      isEmpty: false,
    };
    this.gameArray[gem2Row][gem2Col] = {
      kind: 'gem',
      gemColor: gem1.gemColor,
      gemImage: gem1.gemImage,
      isEmpty: false,
    };

    this.tweenGem(gem1.gemImage, gem2Row, gem2Col, gem1, gem2, swapBack);
    this.tweenGem(gem2.gemImage, gem1Row, gem1Col, gem1, gem2, swapBack);
  }

  private tweenGem(
    gemImage: Phaser.GameObjects.Image,
    row: number,
    col: number,
    gem1: GemCell,
    gem2: GemCell,
    swapBack: boolean,
  ): void {
    this.tweens.add({
      targets: gemImage,
      x: this.toPixel(col),
      y: this.toPixelY(row),
      duration: GAME_CONFIG.swapSpeed,
      onComplete: () => {
        this.swappingGems -= 1;

        if (this.swappingGems !== 0) {
          return;
        }

        if (!this.matchInBoard() && swapBack) {
          if (this.registerWrongMove()) {
            return;
          }

          this.playSoundEffect('noBreak');
          this.swapGems(gem1, gem2, false);
        } else if (this.matchInBoard()) {
          this.handleMatches();
        } else {
          this.finishBoardInteraction();
        }
      },
    });
  }

  private matchInBoard(): boolean {
    for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
      for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
        if (this.isMatch(row, col)) {
          return true;
        }
      }
    }

    return false;
  }

  private handleMatches(): void {
    if (this.gameOutcome !== 'playing') {
      return;
    }

    this.removeMap = Array.from(
      { length: GAME_CONFIG.fieldSize.height },
      () => Array<number>(GAME_CONFIG.fieldSize.width).fill(0),
    );

    this.markMatches('horizontal');
    this.markMatches('vertical');
    const matchedGemCount = this.removeMap.reduce(
      (total, row) => total + row.filter((value) => value > 0).length,
      0,
    );
    this.playSoundEffect(matchedGemCount >= 4 ? 'match4' : 'match3');
    this.destroyGems(matchedGemCount);
  }

  private markMatches(direction: MatchDirection): void {
    const lineCount =
      direction === 'horizontal'
        ? GAME_CONFIG.fieldSize.height
        : GAME_CONFIG.fieldSize.width;
    const lineLength =
      direction === 'horizontal'
        ? GAME_CONFIG.fieldSize.width
        : GAME_CONFIG.fieldSize.height;

    for (let line = 0; line < lineCount; line += 1) {
      let streakStart = 0;

      for (let position = 1; position <= lineLength; position += 1) {
        const previous = this.gemInLine(direction, line, position - 1);
        const current = this.gemInLine(direction, line, position);
        const streakContinues =
          current !== null &&
          previous !== null &&
          !current.isEmpty &&
          !previous.isEmpty &&
          current.kind === 'gem' &&
          previous.kind === 'gem' &&
          current.gemColor === previous.gemColor;

        if (streakContinues) {
          continue;
        }

        const streakLength = position - streakStart;
        if (streakLength >= 3) {
          for (let offset = 0; offset < streakLength; offset += 1) {
            const matchedPosition = streakStart + offset;
            const row = direction === 'horizontal' ? line : matchedPosition;
            const col = direction === 'horizontal' ? matchedPosition : line;
            this.removeMap[row][col] += 1;
          }
        }

        streakStart = position;
      }
    }
  }

  private gemInLine(
    direction: MatchDirection,
    line: number,
    position: number,
  ): BoardCell | null {
    return direction === 'horizontal'
      ? this.gemAt(line, position)
      : this.gemAt(position, line);
  }

  private destroyGems(matchedGemCount: number): void {
    let remaining = matchedGemCount;

    for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
      for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
        if (this.removeMap[row][col] === 0) {
          continue;
        }

        const cell = this.gameArray[row][col];
        cell.isEmpty = true;

        this.tweens.add({
          targets: cell.gemImage,
          alpha: 0.5,
          duration: GAME_CONFIG.destroySpeed,
          onComplete: () => {
            remaining -= 1;
            cell.gemImage.setVisible(false);
            this.poolArray.push(cell.gemImage);

            if (remaining === 0) {
              this.makeGemsFall(() => {
                this.collectBottomKeys();
              });
            }
          },
        });
      }
    }
  }

  private makeGemsFall(onComplete: () => void): void {
    let remaining = 0;

    for (let row = GAME_CONFIG.fieldSize.height - 2; row >= 0; row -= 1) {
      for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
        const cell = this.gameArray[row][col];

        if (cell.isEmpty) {
          continue;
        }

        const fallTiles = this.holesBelow(row, col);
        if (fallTiles === 0) {
          continue;
        }

        remaining += 1;
        this.tweens.add({
          targets: cell.gemImage,
          y: cell.gemImage.y + fallTiles * this.gemSize,
          duration: GAME_CONFIG.fallSpeed * fallTiles,
          onComplete: () => {
            remaining -= 1;
            if (remaining === 0) {
              onComplete();
            }
          },
        });

        this.gameArray[row + fallTiles][col] = { ...cell, isEmpty: false };
        cell.isEmpty = true;
      }
    }

    if (remaining === 0) {
      onComplete();
    }
  }

  private collectBottomKeys(): void {
    const bottomRow = GAME_CONFIG.fieldSize.height - 1;
    const landedKeys: KeyCell[] = [];

    for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
      const cell = this.gameArray[bottomRow][col];
      if (!cell.isEmpty && cell.kind === 'key') {
        cell.isEmpty = true;
        landedKeys.push(cell);
      }
    }

    if (landedKeys.length === 0) {
      this.replenishField();
      return;
    }

    this.collectedKeyCount += landedKeys.length;
    let remaining = landedKeys.length;

    for (const keyCell of landedKeys) {
      // 播放收集音效
      this.playSoundEffect('keyCollect');

      // 猫咪舔手状态（获得道具）
      this.updateCatState('licking');
      this.time.delayedCall(2000, () => {
        if (this.gameOutcome === 'playing') {
          this.updateCatState('idle');
        }
      });

      // 在展示台上显示收集到的道具图标
      this.showCollectedKeyIcon(keyCell.keyId);

      this.tweens.add({
        targets: keyCell.gemImage,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: GAME_CONFIG.destroySpeed,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          keyCell.gemImage.destroy();
          remaining -= 1;

          if (remaining !== 0) {
            return;
          }

          if (
            this.collectedKeyCount >=
            GAME_CONFIG.victoryCondition.keys.length
          ) {
            this.triggerGameSuccess();
          } else {
            // Removing a key creates a hole at the bottom of its column.
            // Settle that column again before the top-only replenish pass.
            this.makeGemsFall(() => {
              this.collectBottomKeys();
            });
          }
        },
      });
    }
  }

  private showCollectedKeyIcon(keyId: string): void {
    if (!this.displayTable) return;

    const { popDuration, popFromScale } = GAME_CONFIG.decorations.keyIcons;
    const keyIcon = this.add
      .image(0, 0, keyId)
      .setDepth(GAME_CONFIG.depths.frontDecoration)
      .setAlpha(0);

    this.collectedKeyIcons.push(keyIcon);
    // Position and size come from the bench's current geometry. Existing pop
    // tweens are left running because the layout itself has not changed.
    this.layoutCollectedKeyIcons(false);

    const baseScale = (keyIcon.getData('baseScale') as number | undefined) ?? 1;
    keyIcon.setScale(baseScale * popFromScale);

    this.tweens.add({
      targets: keyIcon,
      alpha: 1,
      scaleX: baseScale,
      scaleY: baseScale,
      duration: popDuration,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Spreads collected key icons across the bench top using the bench's live
   * display geometry, so they follow it through every resize and rescale.
   *
   * @param snap When true (resize), running pop tweens are cancelled and icons
   * jump to their final transform. When false (a newly collected key), active
   * tweens keep playing toward the unchanged base scale.
   */
  private layoutCollectedKeyIcons(snap: boolean): void {
    if (!this.displayTable || this.collectedKeyIcons.length === 0) {
      return;
    }

    const { widthRatio, surfaceRatio, spacingRatio } =
      GAME_CONFIG.decorations.keyIcons;
    const tableWidth = this.displayTable.displayWidth;
    const iconWidth = tableWidth * widthRatio;
    const spacing = tableWidth * spacingRatio;
    const surfaceY =
      this.displayTable.y -
      this.displayTable.displayHeight * (1 - surfaceRatio);
    const firstX =
      this.displayTable.x - ((this.collectedKeyIcons.length - 1) * spacing) / 2;

    this.collectedKeyIcons.forEach((icon, index) => {
      const source = this.textures.get(icon.texture.key).getSourceImage();
      const baseScale = iconWidth / source.width;

      icon.setData('baseScale', baseScale);
      icon.setVisible(this.displayTable?.visible === true);
      icon.setPosition(firstX + index * spacing, surfaceY);

      if (snap) {
        this.tweens.killTweensOf(icon);
        icon.setScale(baseScale).setAlpha(1);
      } else if (!this.tweens.isTweening(icon)) {
        icon.setScale(baseScale);
      }
    });
  }

  private holesBelow(row: number, col: number): number {
    let result = 0;

    for (
      let nextRow = row + 1;
      nextRow < GAME_CONFIG.fieldSize.height;
      nextRow += 1
    ) {
      if (this.gameArray[nextRow][col].isEmpty) {
        result += 1;
      }
    }

    return result;
  }

  private replenishField(): void {
    let remaining = 0;

    for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
      const emptySpots = this.holesInColumn(col);

      for (let row = 0; row < emptySpots; row += 1) {
        const gemImage = this.poolArray.pop();
        if (gemImage === undefined) {
          throw new Error('Gem pool exhausted while replenishing the board.');
        }

        remaining += 1;

        const gemColor = Phaser.Math.Between(
          0,
          GAME_CONFIG.skin.gems.frameCount - 1,
        );
        this.gameArray[row][col] = {
          kind: 'gem',
          gemColor,
          gemImage,
          isEmpty: false,
        };

        gemImage
          .setFrame(gemColor)
          .setVisible(true)
          .setAlpha(1)
          .setPosition(
            this.toPixel(col),
            this.boardOriginY +
              this.gemSize / 2 -
              (emptySpots - row) * this.gemSize,
          );
        this.restoreGemDisplay(gemImage);

        this.tweens.add({
          targets: gemImage,
          y: this.toPixelY(row),
          duration: GAME_CONFIG.fallSpeed * emptySpots,
          onComplete: () => {
            remaining -= 1;

            if (remaining !== 0) {
              return;
            }

            if (this.matchInBoard()) {
              this.time.delayedCall(GAME_CONFIG.cascadeDelay, () => {
                if (this.gameOutcome === 'playing') {
                  this.handleMatches();
                }
              });
            } else {
              this.finishBoardInteraction();
            }
          },
        });
      }
    }
  }

  private holesInColumn(col: number): number {
    let result = 0;

    for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
      if (this.gameArray[row][col].isEmpty) {
        result += 1;
      }
    }

    return result;
  }
}

export function createGame(): Phaser.Game {
  return new Phaser.Game(createPhaserGameConfig(Match3Scene));
}
