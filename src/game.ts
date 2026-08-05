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
  private isBoardResolving = false;
  private wrongMoveCount = 0;
  private gameOutcome: GameOutcome = 'playing';
  private collectedKeyCount = 0;
  private gameFailTimer: Phaser.Time.TimerEvent | null = null;
  private boomEffects: Phaser.GameObjects.Image[] = [];
  private gameOutcomeImage: Phaser.GameObjects.Image | null = null;
  private gameBackgroundImage: Phaser.GameObjects.Image | null = null;
  private boardBackgroundImage: Phaser.GameObjects.Image | null = null;

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
    this.isBoardResolving = false;
    this.wrongMoveCount = 0;
    this.gameOutcome = 'playing';
    this.collectedKeyCount = 0;
    this.gameFailTimer = null;
    this.boomEffects = [];
    this.gameOutcomeImage = null;
    this.gameBackgroundImage = null;
    this.boardBackgroundImage = null;
  }

  preload(): void {
    this.load.image(
      GAME_CONFIG.skin.gameBackground.textureKey,
      GAME_CONFIG.skin.gameBackground.imageUrl,
    );
    this.load.image(
      GAME_CONFIG.skin.boardBackground.textureKey,
      GAME_CONFIG.skin.boardBackground.imageUrl,
    );
    this.load.spritesheet(
      GAME_CONFIG.skin.gems.textureKey,
      GAME_CONFIG.skin.gems.spritesheetUrl,
      {
        frameWidth: GAME_CONFIG.skin.gems.frameWidth,
        frameHeight: GAME_CONFIG.skin.gems.frameHeight,
      },
    );
    this.load.audio(
      GAME_CONFIG.backgroundMusic.textureKey,
      GAME_CONFIG.backgroundMusic.audioUrl,
    );
    for (const soundEffect of Object.values(GAME_CONFIG.soundEffects)) {
      this.load.audio(soundEffect.textureKey, soundEffect.audioUrl);
    }
    this.load.image(
      'background-music-playing',
      GAME_CONFIG.backgroundMusic.playingImageUrl,
    );
    this.load.image(
      'background-music-paused',
      GAME_CONFIG.backgroundMusic.pausedImageUrl,
    );
    this.load.image(
      GAME_CONFIG.failureConditions.failImage.textureKey,
      GAME_CONFIG.failureConditions.failImage.imageUrl,
    );
    this.load.image(
      GAME_CONFIG.skin.boomEffect.textureKey,
      GAME_CONFIG.skin.boomEffect.imageUrl,
    );
    this.load.image(
      GAME_CONFIG.victoryCondition.successImage.textureKey,
      GAME_CONFIG.victoryCondition.successImage.imageUrl,
    );
    for (const keyAsset of GAME_CONFIG.victoryCondition.keys) {
      this.load.image(keyAsset.textureKey, keyAsset.imageUrl);
    }
  }

  create(): void {
    this.updateBoardLayout();
    this.createBackgroundImages();
    this.drawField();
    this.createBackgroundMusicControls();
    this.startFailureCountdown();

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.gemSelect, this);
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      this.startBackgroundMusicOnFirstPointerDown,
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
      this.input.off(Phaser.Input.Events.POINTER_MOVE, this.startSwipe, this);
      this.input.off(Phaser.Input.Events.POINTER_UP, this.stopSwipe, this);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.backgroundMusic?.stop();
      this.backgroundMusic?.destroy();
      this.backgroundMusic = null;
      this.musicStatusButton = null;
      this.gameFailTimer?.remove();
      this.gameFailTimer = null;
      this.clearBoomEffects();
      this.gameOutcomeImage = null;
      this.gameBackgroundImage = null;
      this.boardBackgroundImage = null;
      this.gameArray = [];
      this.poolArray = [];
      this.removeMap = [];
      this.selectedGem = null;
    });
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
      .setDepth(2)
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
    this.updateGameBackgroundLayout();

    if (this.gameOutcome !== 'playing') {
      if (this.isBoardResolving) {
        this.pendingBoardLayout = true;
      } else {
        this.updateBoardLayout(true);
      }
      this.updateGameOutcomeImagePosition();
      this.updateMusicStatusButtonPosition();
      return;
    }

    if (this.canPick) {
      this.updateBoardLayout(true);
    } else {
      // Do not move targets while a swap or cascade tween is resolving.
      this.pendingBoardLayout = true;
    }
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
    this.showGameOutcomeImage(
      GAME_CONFIG.victoryCondition.successImage.textureKey,
    );
  }

  private finishGame(): void {
    this.canPick = false;
    this.dragging = false;
    this.clearSelection();
    this.gameFailTimer?.remove();
    this.gameFailTimer = null;
    this.clearBoomEffects();
    // Active board tweens must finish so an ended game still settles and
    // replenishes every empty cell. Outcome guards prevent another match pass.
  }

  private createBackgroundImages(): void {
    this.gameBackgroundImage = this.add
      .image(
        this.scale.width / 2,
        this.scale.height / 2,
        GAME_CONFIG.skin.gameBackground.textureKey,
      )
      .setDepth(GAME_CONFIG.skin.gameBackground.depth);
    this.boardBackgroundImage = this.add
      .image(
        this.boardOriginX,
        this.boardOriginY,
        GAME_CONFIG.skin.boardBackground.textureKey,
      )
      .setDepth(GAME_CONFIG.skin.boardBackground.depth);

    this.updateGameBackgroundLayout();
    this.updateBoardBackgroundLayout();
  }

  private updateGameBackgroundLayout(): void {
    if (this.gameBackgroundImage === null) {
      return;
    }

    const source = this.textures
      .get(GAME_CONFIG.skin.gameBackground.textureKey)
      .getSourceImage();
    const coverScale = Math.max(
      this.scale.width / source.width,
      this.scale.height / source.height,
    );

    this.gameBackgroundImage
      .setPosition(this.scale.width / 2, this.scale.height / 2)
      .setScale(coverScale);
  }

  private updateBoardBackgroundLayout(): void {
    const boardWidth = GAME_CONFIG.fieldSize.width * this.gemSize;
    const boardHeight = GAME_CONFIG.fieldSize.height * this.gemSize;

    this.boardBackgroundImage
      ?.setPosition(
        this.boardOriginX + boardWidth / 2,
        this.boardOriginY + boardHeight / 2,
      )
      .setDisplaySize(boardWidth, boardHeight);
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
      .setDepth(10)
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

    this.boardOriginX = this.resolveBoardPosition(
      position.x,
      GAME_CONFIG.fieldSize.width * this.gemSize,
      this.scale.width,
    );
    this.boardOriginY = this.resolveBoardPosition(
      position.y,
      GAME_CONFIG.fieldSize.height * this.gemSize,
      this.scale.height,
    );
    this.updateBoardBackgroundLayout();

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
    const widthLimitedSize =
      availableWidth / (fieldSize.width + selectionOverflow);
    const heightLimitedSize =
      availableHeight / (fieldSize.height + selectionOverflow);

    return Phaser.Math.Clamp(
      Math.min(widthLimitedSize, heightLimitedSize),
      layout.minGemSize,
      layout.maxGemSize,
    );
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
      .setDepth(0);
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
    this.isBoardResolving = false;

    if (this.gameOutcome === 'playing') {
      this.canPick = true;
    }

    this.clearSelection();

    if (!this.pendingBoardLayout) {
      return;
    }

    this.pendingBoardLayout = false;
    this.updateBoardLayout(true);
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
    this.isBoardResolving = true;
    this.swappingGems = 2;

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

        if (this.gameOutcome !== 'playing') {
          this.finishBoardInteraction();
          return;
        }

        if (!this.matchInBoard() && swapBack) {
          if (this.registerWrongMove()) {
            this.finishBoardInteraction();
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
        this.createBoomEffect(cell.gemImage.x, cell.gemImage.y);

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

  private createBoomEffect(x: number, y: number): void {
    const { boomEffect } = GAME_CONFIG.skin;
    const initialSize = this.gemSize * boomEffect.initialSizeRatio;
    const expandedSize = this.gemSize * boomEffect.expandedSizeRatio;
    const effect = this.add
      .image(x, y, boomEffect.textureKey)
      .setDisplaySize(initialSize, initialSize)
      .setAlpha(0)
      .setDepth(boomEffect.depth);

    this.boomEffects.push(effect);
    this.tweens.chain({
      targets: effect,
      tweens: [
        {
          displayWidth: expandedSize,
          displayHeight: expandedSize,
          alpha: 1,
          duration: boomEffect.appearDuration,
          ease: 'Cubic.easeOut',
        },
        {
          alpha: 0,
          duration: boomEffect.fadeDuration,
          ease: 'Cubic.easeIn',
        },
      ],
      onComplete: () => {
        this.disposeBoomEffect(effect);
      },
    });
  }

  private disposeBoomEffect(effect: Phaser.GameObjects.Image): void {
    const effectIndex = this.boomEffects.indexOf(effect);
    if (effectIndex >= 0) {
      this.boomEffects.splice(effectIndex, 1);
    }
    effect.destroy();
  }

  private clearBoomEffects(): void {
    for (const effect of this.boomEffects) {
      this.tweens.killTweensOf(effect);
      effect.destroy();
    }
    this.boomEffects = [];
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
          }

          // Removing a key creates a hole at the bottom of its column. Even
          // after the outcome is decided, settle and replenish the board; the
          // ended state prevents the completed board from cascading again.
          this.makeGemsFall(() => {
            this.collectBottomKeys();
          });
        },
      });
    }
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

            if (this.gameOutcome === 'playing' && this.matchInBoard()) {
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
