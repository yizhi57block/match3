import Phaser from 'phaser';
import { GAME_CONFIG, createPhaserGameConfig } from './game_config';

type MatchDirection = 'horizontal' | 'vertical';
type GameOutcome = 'playing' | 'won' | 'failed';
type CatState = 'idleA' | 'idleB' | 'key' | 'win';
type SoundEffectName = keyof typeof GAME_CONFIG.soundEffects;

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

interface GridPosition {
  row: number;
  col: number;
}

interface SwapHint {
  from: GridPosition;
  to: GridPosition;
}

interface TrophyDisplay {
  item: Phaser.GameObjects.Image;
  check: Phaser.GameObjects.Image;
}

type BoardCell = GemCell | KeyCell;

export class Match3Scene extends Phaser.Scene {
  private gameArray: BoardCell[][] = [];
  private poolArray: Phaser.GameObjects.Image[] = [];
  private removeMap: number[][] = [];
  private selectedGem: GemCell | null = null;
  private selectionRing: Phaser.GameObjects.Arc | null = null;
  private canPick = true;
  private dragging = false;
  private swappingGems = 0;
  private isBoardResolving = false;
  private pendingBoardLayout = false;
  private pendingFailureAfterRollback = false;

  private boardOriginX = 0;
  private boardOriginY = 0;
  private gemSize: number = GAME_CONFIG.layout.maxGemSize;
  private stageWidth = 0;
  private topReserve: number = GAME_CONFIG.layout.topReserve;
  private bottomReserve: number = GAME_CONFIG.layout.bottomReserve;
  private compactLayout = false;

  private gameBackground: Phaser.GameObjects.Image | null = null;
  private boardBackground: Phaser.GameObjects.Image | null = null;
  private lifePanel: Phaser.GameObjects.Image | null = null;
  private lifeIcons: Phaser.GameObjects.Image[] = [];
  private keyStand: Phaser.GameObjects.Image | null = null;
  private collectPromptBackdrop: Phaser.GameObjects.Rectangle | null = null;
  private collectPrompt: Phaser.GameObjects.Image | null = null;
  private trophyDisplays = new Map<string, TrophyDisplay>();
  private catTree: Phaser.GameObjects.Image | null = null;
  private catImage: Phaser.GameObjects.Image | null = null;
  private catState: CatState = 'idleA';
  private speechBubble: Phaser.GameObjects.Image | null = null;
  private meowImage: Phaser.GameObjects.Image | null = null;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private hintHand: Phaser.GameObjects.Image | null = null;

  private backgroundMusic: Phaser.Sound.BaseSound | null = null;
  private purrSound: Phaser.Sound.BaseSound | null = null;
  private musicStatusButton: Phaser.GameObjects.Image | null = null;
  private hasUserInteracted = false;
  private audioEnabled = false;
  private failedAssetKeys = new Set<string>();

  private gameOutcome: GameOutcome = 'playing';
  private wrongMoveCount = 0;
  private collectedKeyIds = new Set<string>();
  private score = 0;
  private cascadeDepth = 0;
  private gameFailTimer: Phaser.Time.TimerEvent | null = null;
  private hintTimer: Phaser.Time.TimerEvent | null = null;
  private idleTimer: Phaser.Time.TimerEvent | null = null;
  private catRevertTimer: Phaser.Time.TimerEvent | null = null;
  private hasMadeFirstBoardMove = false;

  private outcomeMask: Phaser.GameObjects.Image | null = null;
  private gameOutcomeImage: Phaser.GameObjects.Image | null = null;
  private restartButton: Phaser.GameObjects.Rectangle | null = null;
  private restartButtonText: Phaser.GameObjects.Text | null = null;

  private transientEffects = new Set<Phaser.GameObjects.GameObject>();

  constructor() {
    super('Match3');
  }

  init(): void {
    this.gameArray = [];
    this.poolArray = [];
    this.removeMap = [];
    this.selectedGem = null;
    this.selectionRing = null;
    this.canPick = true;
    this.dragging = false;
    this.swappingGems = 0;
    this.isBoardResolving = false;
    this.pendingBoardLayout = false;
    this.pendingFailureAfterRollback = false;

    this.boardOriginX = 0;
    this.boardOriginY = 0;
    this.gemSize = GAME_CONFIG.layout.maxGemSize;
    this.stageWidth = 0;
    this.topReserve = GAME_CONFIG.layout.topReserve;
    this.bottomReserve = GAME_CONFIG.layout.bottomReserve;
    this.compactLayout = false;

    this.gameBackground = null;
    this.boardBackground = null;
    this.lifePanel = null;
    this.lifeIcons = [];
    this.keyStand = null;
    this.collectPromptBackdrop = null;
    this.collectPrompt = null;
    this.trophyDisplays = new Map<string, TrophyDisplay>();
    this.catTree = null;
    this.catImage = null;
    this.catState = 'idleA';
    this.speechBubble = null;
    this.meowImage = null;
    this.scoreText = null;
    this.hintHand = null;

    this.backgroundMusic = null;
    this.purrSound = null;
    this.musicStatusButton = null;
    this.hasUserInteracted = false;
    this.audioEnabled = false;
    this.failedAssetKeys = new Set<string>();

    this.gameOutcome = 'playing';
    this.wrongMoveCount = 0;
    this.collectedKeyIds = new Set<string>();
    this.score = 0;
    this.cascadeDepth = 0;
    this.gameFailTimer = null;
    this.hintTimer = null;
    this.idleTimer = null;
    this.catRevertTimer = null;
    this.hasMadeFirstBoardMove = false;

    this.outcomeMask = null;
    this.gameOutcomeImage = null;
    this.restartButton = null;
    this.restartButtonText = null;
    this.transientEffects = new Set<Phaser.GameObjects.GameObject>();
  }

  preload(): void {
    this.load.on('loaderror', this.handleAssetLoadError, this);

    this.load.image(
      GAME_CONFIG.skin.gameBackground.textureKey,
      GAME_CONFIG.skin.gameBackground.imageUrl,
    );
    this.load.image(GAME_CONFIG.board.textureKey, GAME_CONFIG.board.imageUrl);
    for (const gemAsset of GAME_CONFIG.skin.gems) {
      this.load.image(gemAsset.textureKey, gemAsset.imageUrl);
    }
    this.load.image(
      GAME_CONFIG.skin.boomEffect.textureKey,
      GAME_CONFIG.skin.boomEffect.imageUrl,
    );

    for (const keyAsset of GAME_CONFIG.victoryCondition.keys) {
      this.load.image(keyAsset.textureKey, keyAsset.imageUrl);
    }

    const { lifePanel, targets, character, hint, outcome } = GAME_CONFIG.ui;
    this.load.image(lifePanel.textureKey, lifePanel.imageUrl);
    this.load.image(lifePanel.heartTextureKey, lifePanel.heartImageUrl);
    this.load.image(
      lifePanel.brokenHeartTextureKey,
      lifePanel.brokenHeartImageUrl,
    );
    this.load.image(targets.standTextureKey, targets.standImageUrl);
    this.load.image(targets.promptTextureKey, targets.promptImageUrl);
    this.load.image(targets.checkTextureKey, targets.checkImageUrl);
    this.load.image(character.treeTextureKey, character.treeImageUrl);
    this.load.image(character.idleATextureKey, character.idleAImageUrl);
    this.load.image(character.idleBTextureKey, character.idleBImageUrl);
    this.load.image(character.keyTextureKey, character.keyImageUrl);
    this.load.image(character.winTextureKey, character.winImageUrl);
    this.load.image(character.bubbleTextureKey, character.bubbleImageUrl);
    this.load.image(character.meowTextureKey, character.meowImageUrl);
    this.load.image(hint.textureKey, hint.imageUrl);
    this.load.image(outcome.maskTextureKey, outcome.maskImageUrl);
    this.load.image(
      GAME_CONFIG.failureConditions.failImage.textureKey,
      GAME_CONFIG.failureConditions.failImage.imageUrl,
    );
    this.load.image(
      GAME_CONFIG.victoryCondition.successImage.textureKey,
      GAME_CONFIG.victoryCondition.successImage.imageUrl,
    );
    this.load.image(
      GAME_CONFIG.backgroundMusic.playingTextureKey,
      GAME_CONFIG.backgroundMusic.playingImageUrl,
    );
    this.load.image(
      GAME_CONFIG.backgroundMusic.pausedTextureKey,
      GAME_CONFIG.backgroundMusic.pausedImageUrl,
    );

    this.load.audio(
      GAME_CONFIG.backgroundMusic.textureKey,
      GAME_CONFIG.backgroundMusic.audioUrl,
    );
    for (const soundEffect of Object.values(GAME_CONFIG.soundEffects)) {
      this.load.audio(soundEffect.textureKey, soundEffect.audioUrl);
    }
  }

  create(): void {
    this.load.off('loaderror', this.handleAssetLoadError, this);

    this.calculateBoardLayout();
    this.createBackgrounds();
    this.createSceneUi();
    this.drawField();
    this.createSelectionRing();
    this.createAudioControls();
    this.applySceneLayout(false);
    this.startFailureCountdown();
    this.scheduleInitialHint();

    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      this.handleFirstInteractionAndActivity,
      this,
    );
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.gemSelect, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.startSwipe, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.stopSwipe, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownScene, this);
  }

  private handleAssetLoadError(file: { key: string }): void {
    this.failedAssetKeys.add(file.key);
    console.warn(`[Scene1] Resource failed to load: ${file.key}`);
  }

  private createBackgrounds(): void {
    this.gameBackground = this.add
      .image(
        this.scale.width / 2,
        this.scale.height / 2,
        GAME_CONFIG.skin.gameBackground.textureKey,
      )
      .setDepth(GAME_CONFIG.skin.gameBackground.depth);

    this.boardBackground = this.add
      .image(0, 0, GAME_CONFIG.board.textureKey)
      .setDepth(GAME_CONFIG.board.depth);
  }

  private createSceneUi(): void {
    const { lifePanel, targets, character, hint, score } = GAME_CONFIG.ui;
    const uiDepth = GAME_CONFIG.ui.depth.normal;

    this.lifePanel = this.add
      .image(0, 0, lifePanel.textureKey)
      .setDepth(uiDepth);

    for (
      let index = 0;
      index < GAME_CONFIG.failureConditions.allowedWrongMoves;
      index += 1
    ) {
      this.lifeIcons.push(
        this.add
          .image(0, 0, lifePanel.heartTextureKey)
          .setDepth(uiDepth + 1),
      );
    }

    this.keyStand = this.add
      .image(0, 0, targets.standTextureKey)
      .setDepth(uiDepth);
    this.collectPromptBackdrop = this.add
      .rectangle(
        0,
        0,
        120,
        48,
        targets.promptPanelFillColor,
        targets.promptPanelAlpha,
      )
      .setStrokeStyle(2, targets.promptPanelStrokeColor, 1)
      .setDepth(uiDepth + 1);
    this.collectPrompt = this.add
      .image(0, 0, targets.promptTextureKey)
      .setDepth(uiDepth + 2);

    for (const keyAsset of GAME_CONFIG.victoryCondition.keys) {
      const item = this.add
        .image(0, 0, keyAsset.textureKey)
        .setDepth(uiDepth + 2)
        .setVisible(false);
      const check = this.add
        .image(0, 0, targets.checkTextureKey)
        .setDepth(uiDepth + 3)
        .setVisible(false);
      this.trophyDisplays.set(keyAsset.id, { item, check });
    }

    this.catTree = this.add
      .image(0, 0, character.treeTextureKey)
      .setDepth(uiDepth - 1);
    this.catImage = this.add
      .image(0, 0, character.idleATextureKey)
      .setDepth(uiDepth + 1);
    this.speechBubble = this.add
      .image(0, 0, character.bubbleTextureKey)
      .setDepth(uiDepth + 2)
      .setVisible(false);
    this.meowImage = this.add
      .image(0, 0, character.meowTextureKey)
      .setDepth(uiDepth + 3)
      .setVisible(false);

    this.scoreText = this.add
      .text(0, 0, 'SCORE 0000', {
        fontFamily: score.fontFamily,
        fontSize: `${score.maxFontSize}px`,
        color: score.color,
        stroke: score.stroke,
        strokeThickness: score.strokeThickness,
      })
      .setOrigin(0.5)
      .setDepth(uiDepth + 2);

    this.hintHand = this.add
      .image(0, 0, hint.textureKey)
      .setOrigin(0.2, 0.08)
      .setDepth(uiDepth + 5)
      .setVisible(false);
  }

  private createSelectionRing(): void {
    const { ringColor, ringAlpha, selectedDepth } = GAME_CONFIG.selection;
    this.selectionRing = this.add
      .circle(0, 0, 32, ringColor, 0)
      .setStrokeStyle(4, ringColor, ringAlpha)
      .setDepth(selectedDepth - 1)
      .setVisible(false);
  }

  private createAudioControls(): void {
    if (this.isAudioAvailable(GAME_CONFIG.backgroundMusic.textureKey)) {
      this.backgroundMusic = this.sound.add(
        GAME_CONFIG.backgroundMusic.textureKey,
        {
          loop: true,
          volume: GAME_CONFIG.backgroundMusic.volume,
        },
      );
    }

    const purrConfig = GAME_CONFIG.soundEffects.purr;
    if (this.isAudioAvailable(purrConfig.textureKey)) {
      this.purrSound = this.sound.add(purrConfig.textureKey, {
        loop: true,
        volume: purrConfig.volume,
      });
    }

    const { buttonSize, pausedTextureKey } = GAME_CONFIG.backgroundMusic;
    this.musicStatusButton = this.add
      .image(0, 0, pausedTextureKey)
      .setDisplaySize(buttonSize, buttonSize)
      .setDepth(GAME_CONFIG.ui.depth.controls)
      .setInteractive({ useHandCursor: true });

    this.musicStatusButton.on(
      Phaser.Input.Events.POINTER_DOWN,
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        this.toggleAudio();
      },
    );
  }

  private shutdownScene(): void {
    this.input.off(
      Phaser.Input.Events.POINTER_DOWN,
      this.handleFirstInteractionAndActivity,
      this,
    );
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.gemSelect, this);
    this.input.off(Phaser.Input.Events.POINTER_MOVE, this.startSwipe, this);
    this.input.off(Phaser.Input.Events.POINTER_UP, this.stopSwipe, this);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.load.off('loaderror', this.handleAssetLoadError, this);

    this.time.removeAllEvents();
    this.tweens.killAll();
    this.backgroundMusic?.stop();
    this.backgroundMusic?.destroy();
    this.purrSound?.stop();
    this.purrSound?.destroy();
    this.backgroundMusic = null;
    this.purrSound = null;

    for (const effect of this.transientEffects) {
      effect.destroy();
    }
    this.transientEffects.clear();
    this.gameArray = [];
    this.poolArray = [];
    this.removeMap = [];
    this.lifeIcons = [];
    this.trophyDisplays.clear();
    this.selectedGem = null;
  }

  private handleResize(): void {
    this.updateBackgroundCover();
    this.updateMusicStatusButtonPosition();
    this.layoutOutcome();

    if (this.isBoardResolving) {
      this.pendingBoardLayout = true;
      return;
    }

    this.calculateBoardLayout();
    this.applySceneLayout(true);
  }

  private calculateBoardLayout(): void {
    const { fieldSize, layout, board } = GAME_CONFIG;
    const canvasWidth = Math.max(this.scale.width, 1);
    const canvasHeight = Math.max(this.scale.height, 1);
    const margin = Math.min(layout.outerMargin, canvasWidth * 0.04);

    this.compactLayout = canvasWidth < layout.compactBreakpoint;
    this.stageWidth = this.compactLayout
      ? 0
      : Phaser.Math.Clamp(
          canvasWidth * layout.stageWidthRatio,
          layout.stageMinWidth,
          layout.stageMaxWidth,
        );

    this.topReserve = Math.min(
      layout.topReserve,
      Math.max(70, canvasHeight * 0.12),
    );
    this.bottomReserve = Math.min(
      layout.bottomReserve,
      Math.max(72, canvasHeight * 0.12),
    );

    const stageSpace =
      this.stageWidth > 0 ? this.stageWidth + layout.boardStageGap : 0;
    const availableWidth = Math.max(
      1,
      canvasWidth - margin * 2 - stageSpace,
    );
    const availableHeight = Math.max(
      1,
      canvasHeight -
        margin * 2 -
        this.topReserve -
        this.bottomReserve,
    );
    const fittedGemSize = Math.min(
      layout.maxGemSize,
      availableWidth / fieldSize.width,
      availableHeight / fieldSize.height,
    );
    this.gemSize = Math.max(24, fittedGemSize);

    const boardWidth = fieldSize.width * this.gemSize;
    const boardHeight = fieldSize.height * this.gemSize;
    const contentWidth = boardWidth + stageSpace;
    const responsiveX = Math.max(margin, (canvasWidth - contentWidth) / 2);
    const playAreaTop = margin + this.topReserve;
    const responsiveY =
      playAreaTop + Math.max(0, (availableHeight - boardHeight) / 2);

    this.boardOriginX = this.resolveBoardPosition(
      board.position.x,
      boardWidth,
      canvasWidth,
      responsiveX,
    );
    this.boardOriginY = this.resolveBoardPosition(
      board.position.y,
      boardHeight,
      canvasHeight,
      responsiveY,
    );
  }

  private resolveBoardPosition(
    position: number | 'center' | 'responsive',
    boardSize: number,
    canvasSize: number,
    responsiveValue: number,
  ): number {
    if (position === 'responsive') {
      return responsiveValue;
    }
    return position === 'center' ? (canvasSize - boardSize) / 2 : position;
  }

  private applySceneLayout(moveCells: boolean): void {
    const boardWidth = GAME_CONFIG.fieldSize.width * this.gemSize;
    const boardHeight = GAME_CONFIG.fieldSize.height * this.gemSize;

    this.updateBackgroundCover();
    this.boardBackground
      ?.setPosition(
        this.boardOriginX + boardWidth / 2,
        this.boardOriginY + boardHeight / 2,
      )
      .setDisplaySize(boardWidth, boardHeight);

    if (moveCells) {
      for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
        for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
          const cell = this.gameArray[row]?.[col];
          if (cell === undefined || cell.isEmpty) {
            continue;
          }
          cell.gemImage.setPosition(this.toPixel(col), this.toPixelY(row));
          this.restoreCellDisplay(cell);
        }
      }
    }

    this.layoutLifePanel();
    this.layoutTargetStand();
    this.layoutCharacter();
    this.updateMusicStatusButtonPosition();

    if (this.selectedGem !== null) {
      this.selectGem(this.selectedGem);
    }

    if (
      this.hintHand?.visible &&
      !this.hasMadeFirstBoardMove &&
      this.canPick
    ) {
      this.tweens.killTweensOf(this.hintHand);
      this.showHint();
    }
  }

  private updateBackgroundCover(): void {
    if (this.gameBackground === null) {
      return;
    }

    const source = this.textures
      .get(GAME_CONFIG.skin.gameBackground.textureKey)
      .getSourceImage();
    const scale = Math.max(
      this.scale.width / source.width,
      this.scale.height / source.height,
    );
    this.gameBackground
      .setPosition(this.scale.width / 2, this.scale.height / 2)
      .setScale(scale);
  }

  private layoutLifePanel(): void {
    if (this.lifePanel === null) {
      return;
    }

    const { lifePanel, score } = GAME_CONFIG.ui;
    const boardWidth = GAME_CONFIG.fieldSize.width * this.gemSize;
    const maxCompactWidth = Math.max(150, this.scale.width - 116);
    const panelWidth = Math.min(
      lifePanel.maxWidth,
      boardWidth * lifePanel.boardWidthRatio,
      this.compactLayout ? maxCompactWidth : Number.POSITIVE_INFINITY,
    );
    const panelHeight = panelWidth * (132 / 431);
    const panelX = this.compactLayout
      ? GAME_CONFIG.layout.outerMargin + panelWidth / 2
      : this.boardOriginX + boardWidth / 2;
    const panelY = Math.max(
      GAME_CONFIG.layout.outerMargin + panelHeight / 2,
      this.boardOriginY - this.topReserve / 2,
    );

    this.lifePanel
      .setPosition(panelX, panelY)
      .setDisplaySize(panelWidth, panelHeight);

    const heartHeight = panelHeight * lifePanel.heartHeightRatio;
    const heartAreaWidth = panelWidth * 0.77;
    const heartCount = Math.max(this.lifeIcons.length, 1);
    for (let index = 0; index < this.lifeIcons.length; index += 1) {
      const heart = this.lifeIcons[index];
      const normalized = (index + 0.5) / heartCount - 0.5;
      heart.setPosition(panelX + normalized * heartAreaWidth, panelY - 1);
      this.fitImage(heart, heartHeight, heartHeight);
    }

    const fontSize = Math.max(
      13,
      Math.min(score.maxFontSize, this.gemSize * 0.28),
    );
    this.scoreText
      ?.setFontSize(fontSize)
      .setPosition(panelX, panelY + panelHeight * 0.48);
  }

  private layoutTargetStand(): void {
    if (this.keyStand === null) {
      return;
    }

    const { targets } = GAME_CONFIG.ui;
    const boardWidth = GAME_CONFIG.fieldSize.width * this.gemSize;
    const boardBottom =
      this.boardOriginY + GAME_CONFIG.fieldSize.height * this.gemSize;
    const standWidth = Math.min(
      targets.standMaxWidth,
      boardWidth * targets.standBoardWidthRatio,
      this.scale.width - GAME_CONFIG.layout.outerMargin * 2,
    );
    const standHeight = standWidth * (166 / 591);
    const availableCenter =
      boardBottom +
      Math.max(standHeight / 2 + 3, (this.scale.height - boardBottom) / 2);
    const standY = Math.min(
      this.scale.height - GAME_CONFIG.layout.outerMargin - standHeight / 2,
      availableCenter,
    );
    const standX = this.boardOriginX + boardWidth / 2;

    this.keyStand
      .setPosition(standX, standY)
      .setDisplaySize(standWidth, standHeight);

    const promptHeight = standHeight * targets.promptHeightRatio;
    this.fitImage(this.collectPrompt, promptHeight * 1.8, promptHeight);
    const promptWidth = (this.collectPrompt?.displayWidth ?? 80) + 24;
    const promptPanelHeight = (this.collectPrompt?.displayHeight ?? 36) + 16;
    const standTop = standY - standHeight / 2;
    const promptX = this.compactLayout
      ? standX
      : Math.max(
          GAME_CONFIG.layout.outerMargin + promptWidth / 2,
          standX - standWidth / 2 - promptWidth / 2 - 8,
        );
    const promptY = this.compactLayout
      ? boardBottom + Math.max(18, (standTop - boardBottom) / 2)
      : standY;
    this.collectPromptBackdrop
      ?.setPosition(promptX, promptY)
      .setDisplaySize(promptWidth, promptPanelHeight);
    this.collectPrompt?.setPosition(promptX, promptY);

    const slotOffsets = [-0.305, 0, 0.305];
    GAME_CONFIG.victoryCondition.keys.forEach((keyAsset, index) => {
      const display = this.trophyDisplays.get(keyAsset.id);
      if (display === undefined) {
        return;
      }
      const x = standX + standWidth * slotOffsets[index];
      const y = standY - standHeight * 0.14;
      display.item.setPosition(x, y);
      this.fitImage(display.item, standWidth * 0.17, standHeight * 0.48);
      display.check.setPosition(
        x + standWidth * 0.045,
        y - standHeight * 0.27,
      );
      this.fitImage(
        display.check,
        standHeight * targets.checkHeightRatio,
        standHeight * targets.checkHeightRatio,
      );
    });
  }

  private layoutCharacter(): void {
    if (this.catImage === null || this.catTree === null) {
      return;
    }

    const { character } = GAME_CONFIG.ui;
    const boardWidth = GAME_CONFIG.fieldSize.width * this.gemSize;
    const boardHeight = GAME_CONFIG.fieldSize.height * this.gemSize;

    if (this.compactLayout) {
      this.catTree.setVisible(false);
      const catHeight = Math.min(
        this.topReserve * character.compactCatTopRatio,
        92,
      );
      this.fitImage(this.catImage, catHeight, catHeight);
      this.catImage
        .setVisible(true)
        .setPosition(
          this.scale.width - GAME_CONFIG.layout.outerMargin -
            this.catImage.displayWidth / 2,
          Math.max(
            GAME_CONFIG.layout.outerMargin + this.catImage.displayHeight / 2,
            this.boardOriginY - this.catImage.displayHeight * 0.38,
          ),
        );
    } else {
      const stageCenterX =
        this.boardOriginX +
        boardWidth +
        GAME_CONFIG.layout.boardStageGap +
        this.stageWidth / 2;
      const treeHeight = Math.min(
        boardHeight * character.treeBoardHeightRatio,
        this.scale.height - GAME_CONFIG.layout.outerMargin * 2,
      );
      this.fitImage(this.catTree, this.stageWidth, treeHeight);
      this.catTree
        .setVisible(true)
        .setPosition(
          stageCenterX,
          this.boardOriginY + boardHeight / 2 + boardHeight * 0.05,
        );

      const catHeight = Math.min(
        this.gemSize * character.wideCatGemRatio,
        this.stageWidth * 0.92,
      );
      this.fitImage(this.catImage, this.stageWidth * 0.94, catHeight);
      this.catImage
        .setVisible(true)
        .setPosition(
          stageCenterX,
          this.boardOriginY + this.catImage.displayHeight * 0.48,
        );
    }

    this.layoutSpeechBubble();
  }

  private layoutSpeechBubble(): void {
    if (
      this.catImage === null ||
      this.speechBubble === null ||
      this.meowImage === null
    ) {
      return;
    }

    const bubbleWidth = Math.min(150, Math.max(92, this.gemSize * 1.65));
    this.fitImage(this.speechBubble, bubbleWidth, bubbleWidth * 0.72);
    const direction = this.compactLayout ? -1 : -1;
    const bubbleX =
      this.catImage.x +
      direction *
        (this.catImage.displayWidth * 0.42 +
          this.speechBubble.displayWidth * 0.42);
    const bubbleY = this.catImage.y - this.catImage.displayHeight * 0.22;
    this.speechBubble.setPosition(bubbleX, bubbleY);
    this.fitImage(
      this.meowImage,
      this.speechBubble.displayWidth * 0.5,
      this.speechBubble.displayHeight * 0.22,
    );
    this.meowImage.setPosition(bubbleX, bubbleY - 2);
  }

  private updateMusicStatusButtonPosition(): void {
    const { buttonMargin, buttonSize } = GAME_CONFIG.backgroundMusic;
    this.musicStatusButton?.setPosition(
      this.scale.width - buttonMargin - buttonSize / 2,
      buttonMargin + buttonSize / 2,
    );
  }

  private fitImage(
    image: Phaser.GameObjects.Image | null,
    maxWidth: number,
    maxHeight: number,
  ): void {
    if (image === null || image.width <= 0 || image.height <= 0) {
      return;
    }
    image.setScale(Math.min(maxWidth / image.width, maxHeight / image.height));
  }

  private drawField(): void {
    const firstGem = GAME_CONFIG.skin.gems[0];

    for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
      this.gameArray[row] = [];
      for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
        const gemImage = this.add.image(
          this.toPixel(col),
          this.toPixelY(row),
          firstGem.textureKey,
        );
        const cell: GemCell = {
          kind: 'gem',
          gemColor: 0,
          gemImage,
          isEmpty: false,
        };
        this.gameArray[row][col] = cell;
        this.restoreCellDisplay(cell);
      }
    }

    this.placeVictoryKeys();
    this.randomizeGemColorsUntilPlayable();
  }

  private placeVictoryKeys(): void {
    const availablePositions: GridPosition[] = [];

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
      const position = availablePositions.splice(positionIndex, 1)[0];
      const replacedGem = this.gameArray[position.row][position.col];

      replacedGem.gemImage.setVisible(false);
      this.poolArray.push(replacedGem.gemImage);

      const keyImage = this.add.image(
        this.toPixel(position.col),
        this.toPixelY(position.row),
        keyAsset.textureKey,
      );
      const keyCell: KeyCell = {
        kind: 'key',
        keyId: keyAsset.id,
        gemImage: keyImage,
        isEmpty: false,
      };
      this.gameArray[position.row][position.col] = keyCell;
      this.restoreCellDisplay(keyCell);
    }
  }

  private randomizeGemColorsUntilPlayable(): void {
    const maxAttempts = 300;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
        for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
          const cell = this.gameArray[row][col];
          if (cell.kind !== 'gem' || cell.isEmpty) {
            continue;
          }

          let candidate = 0;
          let guard = 0;
          do {
            candidate = Phaser.Math.Between(
              0,
              GAME_CONFIG.skin.gems.length - 1,
            );
            cell.gemColor = candidate;
            guard += 1;
          } while (this.isMatch(row, col) && guard < 60);

          this.applyGemTexture(cell);
        }
      }

      if (!this.matchInBoard() && this.findValidSwap() !== null) {
        return;
      }
    }

    throw new Error('Unable to create a match-free playable Scene1 board.');
  }

  private applyGemTexture(cell: GemCell): void {
    cell.gemImage.setTexture(
      GAME_CONFIG.skin.gems[cell.gemColor].textureKey,
    );
    this.restoreCellDisplay(cell);
  }

  private restoreCellDisplay(cell: BoardCell): void {
    const artSize = this.gemSize * GAME_CONFIG.skin.cellArtScale;
    this.fitImage(cell.gemImage, artSize, artSize);
    cell.gemImage
      .setAlpha(1)
      .setDepth(GAME_CONFIG.selection.gemDepth)
      .setVisible(!cell.isEmpty);
  }

  private toPixel(gridPosition: number): number {
    return this.boardOriginX + this.gemSize * (gridPosition + 0.5);
  }

  private toPixelY(gridPosition: number): number {
    return this.boardOriginY + this.gemSize * (gridPosition + 0.5);
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

  private isMatch(row: number, col: number): boolean {
    return this.isHorizontalMatch(row, col) || this.isVerticalMatch(row, col);
  }

  private isHorizontalMatch(row: number, col: number): boolean {
    return this.cellsShareColor(
      this.gemAt(row, col),
      this.gemAt(row, col - 1),
      this.gemAt(row, col - 2),
    );
  }

  private isVerticalMatch(row: number, col: number): boolean {
    return this.cellsShareColor(
      this.gemAt(row, col),
      this.gemAt(row - 1, col),
      this.gemAt(row - 2, col),
    );
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

  private findValidSwap(): SwapHint | null {
    for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
      for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
        const cell = this.gemAt(row, col);
        if (cell?.kind !== 'gem' || cell.isEmpty) {
          continue;
        }

        const candidates: GridPosition[] = [
          { row, col: col + 1 },
          { row: row + 1, col },
        ];
        for (const candidate of candidates) {
          const other = this.gemAt(candidate.row, candidate.col);
          if (other?.kind !== 'gem' || other.isEmpty) {
            continue;
          }

          const color = cell.gemColor;
          cell.gemColor = other.gemColor;
          other.gemColor = color;
          const createsMatch = this.matchInBoard();
          other.gemColor = cell.gemColor;
          cell.gemColor = color;

          if (createsMatch) {
            return {
              from: { row, col },
              to: candidate,
            };
          }
        }
      }
    }
    return null;
  }

  private gemSelect(pointer: Phaser.Input.Pointer): void {
    if (!this.canPick || this.gameOutcome !== 'playing') {
      return;
    }

    const row = Math.floor((pointer.y - this.boardOriginY) / this.gemSize);
    const col = Math.floor((pointer.x - this.boardOriginX) / this.gemSize);
    const pickedGem = this.gemAt(row, col);

    if (pickedGem === null || pickedGem.kind !== 'gem' || pickedGem.isEmpty) {
      return;
    }

    this.markFirstBoardMove();
    this.playSoundEffect('click');
    this.dragging = true;

    if (this.selectedGem === null) {
      this.selectGem(pickedGem);
      return;
    }

    if (pickedGem === this.selectedGem) {
      this.clearSelection();
      return;
    }

    if (this.areNext(pickedGem, this.selectedGem)) {
      const selected = this.selectedGem;
      this.clearSelection();
      this.swapGems(selected, pickedGem, true);
      return;
    }

    this.clearSelection();
    this.selectGem(pickedGem);
  }

  private selectGem(gem: GemCell): void {
    this.restoreCellDisplay(gem);
    gem.gemImage
      .setScale(
        gem.gemImage.scaleX * GAME_CONFIG.selection.scale,
        gem.gemImage.scaleY * GAME_CONFIG.selection.scale,
      )
      .setDepth(GAME_CONFIG.selection.selectedDepth);

    if (this.selectionRing !== null) {
      const diameter =
        this.gemSize * GAME_CONFIG.selection.ringRadiusRatio * 2;
      this.selectionRing
        .setPosition(gem.gemImage.x, gem.gemImage.y)
        .setScale(diameter / this.selectionRing.width)
        .setStrokeStyle(
          Math.max(
            2,
            this.gemSize * GAME_CONFIG.selection.ringWidthRatio,
          ),
          GAME_CONFIG.selection.ringColor,
          GAME_CONFIG.selection.ringAlpha,
        )
        .setVisible(true);
    }
    this.selectedGem = gem;
  }

  private clearSelection(): void {
    if (this.selectedGem !== null) {
      this.restoreCellDisplay(this.selectedGem);
    }
    this.selectedGem = null;
    this.selectionRing?.setVisible(false);
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
      deltaX > this.gemSize * 0.32 &&
      Math.abs(deltaY) < this.gemSize * 0.52
    ) {
      deltaCol = -1;
    } else if (
      deltaX < -this.gemSize * 0.32 &&
      Math.abs(deltaY) < this.gemSize * 0.52
    ) {
      deltaCol = 1;
    } else if (
      deltaY > this.gemSize * 0.32 &&
      Math.abs(deltaX) < this.gemSize * 0.52
    ) {
      deltaRow = -1;
    } else if (
      deltaY < -this.gemSize * 0.32 &&
      Math.abs(deltaX) < this.gemSize * 0.52
    ) {
      deltaRow = 1;
    }

    if (deltaRow === 0 && deltaCol === 0) {
      return;
    }

    const selected = this.selectedGem;
    const selectedPosition = this.findCellPosition(selected);
    if (selectedPosition === null) {
      this.clearSelection();
      this.dragging = false;
      return;
    }

    const pickedGem = this.gemAt(
      selectedPosition.row + deltaRow,
      selectedPosition.col + deltaCol,
    );

    if (pickedGem?.kind === 'gem' && !pickedGem.isEmpty) {
      this.markFirstBoardMove();
      this.clearSelection();
      this.dragging = false;
      this.swapGems(selected, pickedGem, true);
    } else if (pickedGem?.kind === 'key') {
      this.dragging = false;
    }
  }

  private stopSwipe(): void {
    this.dragging = false;
  }

  private findCellPosition(cell: BoardCell): GridPosition | null {
    for (let row = 0; row < GAME_CONFIG.fieldSize.height; row += 1) {
      const col = this.gameArray[row].indexOf(cell);
      if (col >= 0) {
        return { row, col };
      }
    }
    return null;
  }

  private areNext(gem1: GemCell, gem2: GemCell): boolean {
    const position1 = this.findCellPosition(gem1);
    const position2 = this.findCellPosition(gem2);
    if (position1 === null || position2 === null) {
      return false;
    }
    return (
      Math.abs(position1.row - position2.row) +
        Math.abs(position1.col - position2.col) ===
      1
    );
  }

  private swapGems(gem1: GemCell, gem2: GemCell, swapBack: boolean): void {
    const position1 = this.findCellPosition(gem1);
    const position2 = this.findCellPosition(gem2);
    if (position1 === null || position2 === null) {
      this.finishBoardInteraction();
      return;
    }

    this.canPick = false;
    this.isBoardResolving = true;
    this.swappingGems = 2;
    if (swapBack) {
      this.playSoundEffect('swap');
    }

    this.gameArray[position1.row][position1.col] = gem2;
    this.gameArray[position2.row][position2.col] = gem1;

    this.tweenGem(gem1, position2, gem1, gem2, swapBack);
    this.tweenGem(gem2, position1, gem1, gem2, swapBack);
  }

  private tweenGem(
    cell: GemCell,
    position: GridPosition,
    gem1: GemCell,
    gem2: GemCell,
    swapBack: boolean,
  ): void {
    this.tweens.add({
      targets: cell.gemImage,
      x: this.toPixel(position.col),
      y: this.toPixelY(position.row),
      duration: GAME_CONFIG.animations.swapSpeed,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.swappingGems -= 1;
        if (this.swappingGems !== 0) {
          return;
        }

        const boardHasMatch = this.matchInBoard();
        if (boardHasMatch && this.gameOutcome === 'playing') {
          this.cascadeDepth = 0;
          this.handleMatches();
          return;
        }

        if (swapBack) {
          this.pendingFailureAfterRollback = this.registerWrongMove();
          this.showWrongMoveFeedback();
          this.swapGems(gem1, gem2, false);
          return;
        }

        if (
          this.pendingFailureAfterRollback &&
          this.gameOutcome === 'playing'
        ) {
          this.pendingFailureAfterRollback = false;
          this.isBoardResolving = false;
          this.triggerGameFail();
          return;
        }

        this.pendingFailureAfterRollback = false;
        this.finishBoardInteraction();
      },
    });
  }

  private handleMatches(): void {
    if (this.gameOutcome !== 'playing') {
      this.finishTerminalResolution();
      return;
    }

    this.isBoardResolving = true;
    this.cascadeDepth += 1;
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
    if (matchedGemCount === 0) {
      this.finishBoardInteraction();
      return;
    }

    this.score += matchedGemCount * 100 * this.cascadeDepth;
    this.updateScoreText();
    if (this.cascadeDepth > 1) {
      this.playSoundEffect('cascade');
      this.showComboFeedback();
    } else {
      this.playSoundEffect(matchedGemCount >= 4 ? 'matchBig' : 'match');
    }
    this.playSoundEffect('boom');
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
        if (cell.kind !== 'gem') {
          continue;
        }
        cell.isEmpty = true;
        this.createBoomEffect(cell.gemImage.x, cell.gemImage.y);
        const startScaleX = cell.gemImage.scaleX;
        const startScaleY = cell.gemImage.scaleY;

        this.tweens.add({
          targets: cell.gemImage,
          alpha: 0,
          scaleX: startScaleX * 0.45,
          scaleY: startScaleY * 0.45,
          duration: GAME_CONFIG.animations.destroySpeed,
          ease: 'Back.easeIn',
          onComplete: () => {
            remaining -= 1;
            cell.gemImage.setVisible(false).setAlpha(1);
            this.poolArray.push(cell.gemImage);

            if (remaining === 0) {
              this.makeGemsFall(() => this.collectBottomKeys());
            }
          },
        });
      }
    }
  }

  private createBoomEffect(x: number, y: number): void {
    const effectConfig = GAME_CONFIG.skin.boomEffect;
    const effect = this.add
      .image(x, y, effectConfig.textureKey)
      .setDepth(effectConfig.depth)
      .setAlpha(0.95);
    const startSize = this.gemSize * effectConfig.startScale;
    const endSize = this.gemSize * effectConfig.endScale;
    this.fitImage(effect, startSize, startSize);
    const finalScaleX = effect.scaleX * (endSize / startSize);
    const finalScaleY = effect.scaleY * (endSize / startSize);
    this.transientEffects.add(effect);

    this.tweens.add({
      targets: effect,
      scaleX: finalScaleX,
      scaleY: finalScaleY,
      alpha: 0,
      angle: Phaser.Math.Between(-24, 24),
      duration: effectConfig.duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.transientEffects.delete(effect);
        effect.destroy();
      },
    });
  }

  private makeGemsFall(onComplete: () => void): void {
    let remaining = 0;

    for (let col = 0; col < GAME_CONFIG.fieldSize.width; col += 1) {
      let writeRow = GAME_CONFIG.fieldSize.height - 1;

      for (let row = GAME_CONFIG.fieldSize.height - 1; row >= 0; row -= 1) {
        const cell = this.gameArray[row][col];
        if (cell.isEmpty) {
          continue;
        }

        if (row !== writeRow) {
          const emptyPlaceholder = this.gameArray[writeRow][col];
          this.gameArray[writeRow][col] = cell;
          this.gameArray[row][col] = emptyPlaceholder;
          cell.isEmpty = false;
          emptyPlaceholder.isEmpty = true;

          remaining += 1;
          const fallTiles = writeRow - row;
          this.tweens.add({
            targets: cell.gemImage,
            y: this.toPixelY(writeRow),
            duration: GAME_CONFIG.animations.fallSpeed * fallTiles,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              remaining -= 1;
              if (remaining === 0) {
                onComplete();
              }
            },
          });
        }
        writeRow -= 1;
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

    let remaining = landedKeys.length;
    for (const keyCell of landedKeys) {
      const trophy = this.trophyDisplays.get(keyCell.keyId);
      const targetX = trophy?.item.x ?? keyCell.gemImage.x;
      const targetY = trophy?.item.y ?? keyCell.gemImage.y;
      keyCell.gemImage.setDepth(GAME_CONFIG.ui.depth.controls - 1);

      this.tweens.add({
        targets: keyCell.gemImage,
        x: targetX,
        y: targetY,
        alpha: 0,
        scaleX: (trophy?.item.scaleX ?? keyCell.gemImage.scaleX) * 0.65,
        scaleY: (trophy?.item.scaleY ?? keyCell.gemImage.scaleY) * 0.65,
        duration: GAME_CONFIG.animations.destroySpeed * 2,
        ease: 'Cubic.easeInOut',
        onComplete: () => {
          keyCell.gemImage.destroy();
          this.revealCollectedKey(keyCell.keyId);
          remaining -= 1;

          if (remaining !== 0) {
            return;
          }

          this.showKeyCollectedFeedback();
          if (
            this.collectedKeyIds.size >=
              GAME_CONFIG.victoryCondition.keys.length &&
            this.gameOutcome === 'playing'
          ) {
            this.triggerGameSuccess();
          }

          // 最后一个 KeyCell 触发结算后仍继续落下和补满；
          // replenishField 会在非 playing 状态禁止开启新一轮消除。
          this.makeGemsFall(() => this.collectBottomKeys());
        },
      });
    }
  }

  private revealCollectedKey(keyId: string): void {
    this.collectedKeyIds.add(keyId);
    const display = this.trophyDisplays.get(keyId);
    if (display === undefined) {
      return;
    }

    display.item.setVisible(true).setAlpha(1);
    display.check.setVisible(true).setAlpha(1);
    const itemScaleX = display.item.scaleX;
    const itemScaleY = display.item.scaleY;
    const checkScaleX = display.check.scaleX;
    const checkScaleY = display.check.scaleY;
    display.item.setScale(itemScaleX * 0.35, itemScaleY * 0.35);
    display.check.setScale(checkScaleX * 0.2, checkScaleY * 0.2);
    this.tweens.add({
      targets: display.item,
      scaleX: itemScaleX,
      scaleY: itemScaleY,
      duration: 280,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: display.check,
      scaleX: checkScaleX,
      scaleY: checkScaleY,
      delay: 130,
      duration: 240,
      ease: 'Back.easeOut',
    });
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
          GAME_CONFIG.skin.gems.length - 1,
        );
        const cell: GemCell = {
          kind: 'gem',
          gemColor,
          gemImage,
          isEmpty: false,
        };
        this.gameArray[row][col] = cell;
        this.applyGemTexture(cell);
        gemImage
          .setVisible(true)
          .setAlpha(1)
          .setPosition(
            this.toPixel(col),
            this.boardOriginY +
              this.gemSize / 2 -
              (emptySpots - row) * this.gemSize,
          );

        this.tweens.add({
          targets: gemImage,
          y: this.toPixelY(row),
          duration: GAME_CONFIG.animations.fallSpeed * emptySpots,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            remaining -= 1;
            if (remaining === 0) {
              this.finishReplenishment();
            }
          },
        });
      }
    }

    if (remaining === 0) {
      this.finishReplenishment();
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

  private finishReplenishment(): void {
    if (this.gameOutcome !== 'playing') {
      this.finishTerminalResolution();
      return;
    }

    if (this.matchInBoard()) {
      this.time.delayedCall(GAME_CONFIG.animations.cascadeDelay, () => {
        if (this.gameOutcome === 'playing') {
          this.handleMatches();
        } else {
          this.finishTerminalResolution();
        }
      });
      return;
    }

    if (this.findValidSwap() === null) {
      this.reshuffleBoard(() => this.finishBoardInteraction());
      return;
    }
    this.finishBoardInteraction();
  }

  private reshuffleBoard(onComplete: () => void): void {
    this.randomizeGemColorsUntilPlayable();
    const gemCells = this.gameArray
      .flat()
      .filter((cell): cell is GemCell => cell.kind === 'gem' && !cell.isEmpty);

    if (gemCells.length === 0) {
      onComplete();
      return;
    }

    let remaining = gemCells.length;
    for (const cell of gemCells) {
      const finalScaleX = cell.gemImage.scaleX;
      const finalScaleY = cell.gemImage.scaleY;
      cell.gemImage.setScale(finalScaleX * 0.72, finalScaleY * 0.72);
      this.tweens.add({
        targets: cell.gemImage,
        scaleX: finalScaleX,
        scaleY: finalScaleY,
        duration: GAME_CONFIG.animations.reshuffleDuration,
        ease: 'Back.easeOut',
        onComplete: () => {
          remaining -= 1;
          if (remaining === 0) {
            onComplete();
          }
        },
      });
    }
  }

  private finishBoardInteraction(): void {
    this.isBoardResolving = false;
    this.dragging = false;
    this.cascadeDepth = 0;
    this.clearSelection();

    if (this.pendingBoardLayout) {
      this.pendingBoardLayout = false;
      this.calculateBoardLayout();
      this.applySceneLayout(true);
    }

    if (this.gameOutcome === 'playing') {
      this.canPick = true;
    }
  }

  private finishTerminalResolution(): void {
    this.isBoardResolving = false;
    this.dragging = false;
    this.canPick = false;
    this.clearSelection();

    if (this.pendingBoardLayout) {
      this.pendingBoardLayout = false;
      this.calculateBoardLayout();
      this.applySceneLayout(true);
    }
  }

  private registerWrongMove(): boolean {
    const maxWrongMoves = GAME_CONFIG.failureConditions.allowedWrongMoves;
    if (maxWrongMoves <= 0) {
      return false;
    }

    this.wrongMoveCount += 1;
    this.updateLifeIcons(true);
    return this.wrongMoveCount >= maxWrongMoves;
  }

  private updateLifeIcons(animateLatest: boolean): void {
    const { lifePanel } = GAME_CONFIG.ui;
    const remainingLives = Math.max(
      0,
      GAME_CONFIG.failureConditions.allowedWrongMoves - this.wrongMoveCount,
    );

    this.lifeIcons.forEach((heart, index) => {
      const isWhole = index < remainingLives;
      heart.setTexture(
        isWhole
          ? lifePanel.heartTextureKey
          : lifePanel.brokenHeartTextureKey,
      );
      const targetHeight = (this.lifePanel?.displayHeight ?? 80) *
        lifePanel.heartHeightRatio;
      this.fitImage(heart, targetHeight, targetHeight);

      if (animateLatest && index === remainingLives) {
        const finalScaleX = heart.scaleX;
        const finalScaleY = heart.scaleY;
        heart.setScale(finalScaleX * 1.28, finalScaleY * 1.28);
        this.tweens.add({
          targets: heart,
          scaleX: finalScaleX,
          scaleY: finalScaleY,
          duration: 260,
          ease: 'Bounce.easeOut',
        });
      }
    });
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

  private triggerGameFail(): void {
    if (this.gameOutcome !== 'playing') {
      return;
    }
    this.gameOutcome = 'failed';
    this.finishGame();
    this.setCatState('idleA', false);
    this.playSoundEffect('fail');
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
    this.setCatState('win', true);
    this.playSoundEffect('successMeow');
    this.playSoundEffect('successClap');
    this.showGameOutcomeImage(
      GAME_CONFIG.victoryCondition.successImage.textureKey,
    );
  }

  private finishGame(): void {
    this.canPick = false;
    this.dragging = false;
    this.pendingFailureAfterRollback = false;
    this.clearSelection();
    this.stopHint();
    this.stopPurr();
    this.gameFailTimer?.remove();
    this.gameFailTimer = null;
    this.idleTimer?.remove();
    this.idleTimer = null;
    // 不 kill 当前消除/掉落 tween；终局仍要补满棋盘。
  }

  private showGameOutcomeImage(textureKey: string): void {
    const { outcome, depth } = GAME_CONFIG.ui;
    this.outcomeMask = this.add
      .image(this.scale.width / 2, this.scale.height / 2, outcome.maskTextureKey)
      .setDepth(depth.outcomeMask)
      .setAlpha(0.58);

    const finalScale = this.resolveOutcomeScale(textureKey);
    this.gameOutcomeImage = this.add
      .image(this.scale.width / 2, this.scale.height * 0.46, textureKey)
      .setDepth(depth.outcome)
      .setScale(finalScale * outcome.initialScale);

    this.restartButton = this.add
      .rectangle(
        0,
        0,
        220,
        50,
        outcome.restartFillColor,
        0.96,
      )
      .setStrokeStyle(3, outcome.restartStrokeColor, 1)
      .setDepth(depth.outcome + 1)
      .setInteractive({ useHandCursor: true });
    this.restartButtonText = this.add
      .text(0, 0, '再玩一次', {
        fontFamily: GAME_CONFIG.ui.score.fontFamily,
        fontSize: '22px',
        color: outcome.restartTextColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(depth.outcome + 2);

    this.restartButton.on(
      Phaser.Input.Events.POINTER_DOWN,
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        this.scene.restart();
      },
    );

    this.layoutOutcome();
    this.tweens.add({
      targets: this.gameOutcomeImage,
      scaleX: finalScale,
      scaleY: finalScale,
      duration: outcome.popDuration,
      ease: 'Back.easeOut',
    });
  }

  private resolveOutcomeScale(textureKey: string): number {
    const source = this.textures.get(textureKey).getSourceImage();
    const coverage = GAME_CONFIG.ui.outcome.maxViewportCoverage;
    return Math.min(
      (this.scale.width * coverage) / source.width,
      (this.scale.height * coverage) / source.height,
    );
  }

  private layoutOutcome(): void {
    if (this.gameOutcomeImage === null) {
      return;
    }

    const finalScale = this.resolveOutcomeScale(
      this.gameOutcomeImage.texture.key,
    );
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height * 0.46;
    const popupHeight = this.gameOutcomeImage.height * finalScale;
    const buttonWidth = Math.min(220, this.scale.width * 0.58);
    const buttonHeight = Math.max(42, Math.min(52, this.scale.height * 0.07));
    const buttonY = Math.min(
      this.scale.height - buttonHeight / 2 - 18,
      centerY + popupHeight * 0.43,
    );

    if (!this.tweens.isTweening(this.gameOutcomeImage)) {
      this.gameOutcomeImage.setScale(finalScale);
    }
    this.gameOutcomeImage.setPosition(centerX, centerY);
    this.fitCoverImage(this.outcomeMask);
    this.restartButton
      ?.setPosition(centerX, buttonY)
      .setDisplaySize(buttonWidth, buttonHeight);
    this.restartButtonText
      ?.setPosition(centerX, buttonY)
      .setFontSize(Math.max(18, buttonHeight * 0.42));
  }

  private fitCoverImage(image: Phaser.GameObjects.Image | null): void {
    if (image === null) {
      return;
    }
    const scale = Math.max(
      this.scale.width / image.width,
      this.scale.height / image.height,
    );
    image
      .setPosition(this.scale.width / 2, this.scale.height / 2)
      .setScale(scale);
  }

  private updateScoreText(): void {
    this.scoreText?.setText(`SCORE ${this.score.toString().padStart(4, '0')}`);
  }

  private showComboFeedback(): void {
    const config = GAME_CONFIG.ui.combo;
    const comboText = this.add
      .text(
        this.boardOriginX +
          (GAME_CONFIG.fieldSize.width * this.gemSize) / 2,
        this.boardOriginY +
          (GAME_CONFIG.fieldSize.height * this.gemSize) / 2,
        `COMBO ×${this.cascadeDepth}`,
        {
          fontFamily: GAME_CONFIG.ui.score.fontFamily,
          fontSize: `${Math.max(24, this.gemSize * 0.42)}px`,
          color: config.color,
          stroke: config.stroke,
          strokeThickness: 5,
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setDepth(GAME_CONFIG.ui.depth.normal + 6);
    this.transientEffects.add(comboText);

    this.tweens.add({
      targets: comboText,
      y: comboText.y - this.gemSize * config.riseGemRatio,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: config.duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.transientEffects.delete(comboText);
        comboText.destroy();
      },
    });
  }

  private showWrongMoveFeedback(): void {
    this.setCatState('idleB', true);
    this.speechBubble?.setVisible(true).setAlpha(1);
    this.meowImage?.setVisible(true).setAlpha(1);
    this.layoutSpeechBubble();
    this.catRevertTimer?.remove();
    this.catRevertTimer = this.time.delayedCall(
      GAME_CONFIG.ui.character.feedbackDuration,
      () => {
        this.speechBubble?.setVisible(false);
        this.meowImage?.setVisible(false);
        if (this.gameOutcome === 'playing') {
          this.setCatState('idleA', false);
        }
      },
    );
  }

  private showKeyCollectedFeedback(): void {
    this.playSoundEffect('matchBig');
    if (this.gameOutcome === 'playing') {
      this.setCatState('key', true);
      this.catRevertTimer?.remove();
      this.catRevertTimer = this.time.delayedCall(
        GAME_CONFIG.ui.character.feedbackDuration,
        () => {
          if (this.gameOutcome === 'playing') {
            this.setCatState('idleA', false);
          }
        },
      );
    }
  }

  private setCatState(state: CatState, bounce: boolean): void {
    if (this.catImage === null) {
      return;
    }

    this.catState = state;
    const character = GAME_CONFIG.ui.character;
    const textureKey = {
      idleA: character.idleATextureKey,
      idleB: character.idleBTextureKey,
      key: character.keyTextureKey,
      win: character.winTextureKey,
    }[state];
    this.tweens.killTweensOf(this.catImage);
    this.catImage.setTexture(textureKey);
    this.layoutCharacter();

    if (bounce) {
      this.tweens.add({
        targets: this.catImage,
        y: this.catImage.y - this.gemSize * character.bounceGemRatio,
        duration: 220,
        ease: 'Sine.easeOut',
        yoyo: true,
      });
    }
  }

  private scheduleInitialHint(): void {
    this.hintTimer?.remove();
    this.hintTimer = this.time.delayedCall(
      GAME_CONFIG.ui.hint.delay,
      this.showHint,
      [],
      this,
    );
  }

  private showHint(): void {
    if (
      this.hasMadeFirstBoardMove ||
      !this.canPick ||
      this.gameOutcome !== 'playing' ||
      this.hintHand === null
    ) {
      return;
    }

    const hint = this.findValidSwap();
    if (hint === null) {
      return;
    }

    const config = GAME_CONFIG.ui.hint;
    const startX = this.toPixel(hint.from.col);
    const startY = this.toPixelY(hint.from.row);
    const deltaX =
      (hint.to.col - hint.from.col) * this.gemSize * config.travelGemRatio;
    const deltaY =
      (hint.to.row - hint.from.row) * this.gemSize * config.travelGemRatio;
    const height = this.gemSize * config.gemHeightRatio;
    this.fitImage(this.hintHand, height, height);
    this.hintHand
      .setPosition(startX, startY)
      .setAlpha(0.9)
      .setVisible(true);

    this.tweens.add({
      targets: this.hintHand,
      x: startX + deltaX,
      y: startY + deltaY,
      duration: config.duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private markFirstBoardMove(): void {
    if (this.hasMadeFirstBoardMove) {
      return;
    }
    this.hasMadeFirstBoardMove = true;
    this.stopHint();
  }

  private stopHint(): void {
    this.hintTimer?.remove();
    this.hintTimer = null;
    if (this.hintHand !== null) {
      this.tweens.killTweensOf(this.hintHand);
      this.hintHand.setVisible(false);
    }
  }

  private handleFirstInteractionAndActivity(): void {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true;
      this.audioEnabled = true;
      if (GAME_CONFIG.backgroundMusic.startOnFirstPointerDown) {
        this.playBackgroundMusic();
      }
      this.updateMusicStatusButton();
    }

    this.stopPurr();
    if (this.catState === 'idleB' && this.gameOutcome === 'playing') {
      this.setCatState('idleA', false);
    }
    this.scheduleIdleFeedback();
  }

  private scheduleIdleFeedback(): void {
    this.idleTimer?.remove();
    this.idleTimer = null;
    if (
      !this.hasUserInteracted ||
      !this.audioEnabled ||
      this.gameOutcome !== 'playing'
    ) {
      return;
    }

    this.idleTimer = this.time.delayedCall(
      GAME_CONFIG.idleFeedback.delay,
      () => {
        if (this.gameOutcome !== 'playing' || !this.audioEnabled) {
          return;
        }
        this.setCatState('idleB', true);
        if (this.purrSound !== null && !this.purrSound.isPlaying) {
          this.purrSound.play();
        }
      },
    );
  }

  private toggleAudio(): void {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true;
      this.audioEnabled = true;
    } else {
      this.audioEnabled = !this.audioEnabled;
    }

    if (this.audioEnabled) {
      this.playBackgroundMusic();
      this.scheduleIdleFeedback();
    } else {
      this.backgroundMusic?.pause();
      this.stopPurr();
      this.idleTimer?.remove();
      this.idleTimer = null;
    }
    this.updateMusicStatusButton();
  }

  private playBackgroundMusic(): void {
    if (
      !this.audioEnabled ||
      !this.hasUserInteracted ||
      this.backgroundMusic === null ||
      this.backgroundMusic.isPlaying
    ) {
      return;
    }

    if (this.backgroundMusic.isPaused) {
      this.backgroundMusic.resume();
    } else {
      this.backgroundMusic.play();
    }
  }

  private stopPurr(): void {
    if (this.purrSound?.isPlaying || this.purrSound?.isPaused) {
      this.purrSound.stop();
    }
  }

  private updateMusicStatusButton(): void {
    this.musicStatusButton?.setTexture(
      this.audioEnabled
        ? GAME_CONFIG.backgroundMusic.playingTextureKey
        : GAME_CONFIG.backgroundMusic.pausedTextureKey,
    );
  }

  private playSoundEffect(soundEffect: SoundEffectName): void {
    if (!this.audioEnabled || !this.hasUserInteracted) {
      return;
    }
    const config = GAME_CONFIG.soundEffects[soundEffect];
    if (!this.isAudioAvailable(config.textureKey)) {
      return;
    }

    try {
      this.sound.play(config.textureKey, { volume: config.volume });
    } catch (error: unknown) {
      this.failedAssetKeys.add(config.textureKey);
      console.warn(`[Scene1] Audio playback skipped: ${config.textureKey}`, error);
    }
  }

  private isAudioAvailable(textureKey: string): boolean {
    return (
      !this.failedAssetKeys.has(textureKey) &&
      this.cache.audio.exists(textureKey)
    );
  }
}

export function createGame(): Phaser.Game {
  return new Phaser.Game(createPhaserGameConfig(Match3Scene));
}
