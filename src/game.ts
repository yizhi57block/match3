import Phaser from 'phaser';

const GAME_OPTIONS = {
  fieldSize: 7,
  gemColors: 6,
  gemSize: 100,
  swapSpeed: 200,
  fallSpeed: 100,
  destroySpeed: 200,
  cascadeDelay: 250,
} as const;

const GAME_SIZE = GAME_OPTIONS.fieldSize * GAME_OPTIONS.gemSize;
const GEMS_TEXTURE = 'gems';

type MatchDirection = 'horizontal' | 'vertical';

interface GemCell {
  gemColor: number;
  gemImage: Phaser.GameObjects.Image;
  isEmpty: boolean;
}

export class Match3Scene extends Phaser.Scene {
  private gameArray: GemCell[][] = [];
  private poolArray: Phaser.GameObjects.Image[] = [];
  private removeMap: number[][] = [];
  private selectedGem: GemCell | null = null;
  private canPick = true;
  private dragging = false;
  private swappingGems = 0;

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
  }

  preload(): void {
    this.load.spritesheet(GEMS_TEXTURE, '/sprites/gems.png', {
      frameWidth: GAME_OPTIONS.gemSize,
      frameHeight: GAME_OPTIONS.gemSize,
    });
  }

  create(): void {
    this.drawField();

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.gemSelect, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.startSwipe, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.stopSwipe, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.gemSelect, this);
      this.input.off(Phaser.Input.Events.POINTER_MOVE, this.startSwipe, this);
      this.input.off(Phaser.Input.Events.POINTER_UP, this.stopSwipe, this);
      this.gameArray = [];
      this.poolArray = [];
      this.removeMap = [];
      this.selectedGem = null;
    });
  }

  private drawField(): void {
    for (let row = 0; row < GAME_OPTIONS.fieldSize; row += 1) {
      this.gameArray[row] = [];

      for (let col = 0; col < GAME_OPTIONS.fieldSize; col += 1) {
        const gemImage = this.add.image(
          this.toPixel(col),
          this.toPixel(row),
          GEMS_TEXTURE,
          0,
        );
        const cell: GemCell = {
          gemColor: 0,
          gemImage,
          isEmpty: false,
        };

        this.gameArray[row][col] = cell;

        do {
          cell.gemColor = Phaser.Math.Between(0, GAME_OPTIONS.gemColors - 1);
          gemImage.setFrame(cell.gemColor);
        } while (this.isMatch(row, col));
      }
    }
  }

  private toPixel(gridPosition: number): number {
    return GAME_OPTIONS.gemSize * gridPosition + GAME_OPTIONS.gemSize / 2;
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

  private cellsShareColor(...cells: Array<GemCell | null>): boolean {
    if (cells.some((cell) => cell === null || cell.isEmpty)) {
      return false;
    }

    const [first, ...rest] = cells as GemCell[];
    return rest.every((cell) => cell.gemColor === first.gemColor);
  }

  private gemAt(row: number, col: number): GemCell | null {
    if (
      row < 0 ||
      row >= GAME_OPTIONS.fieldSize ||
      col < 0 ||
      col >= GAME_OPTIONS.fieldSize
    ) {
      return null;
    }

    return this.gameArray[row]?.[col] ?? null;
  }

  private gemSelect(pointer: Phaser.Input.Pointer): void {
    if (!this.canPick) {
      return;
    }

    this.dragging = true;

    const row = Math.floor(pointer.y / GAME_OPTIONS.gemSize);
    const col = Math.floor(pointer.x / GAME_OPTIONS.gemSize);
    const pickedGem = this.gemAt(row, col);

    if (pickedGem === null) {
      return;
    }

    if (this.selectedGem === null) {
      this.selectGem(pickedGem);
      return;
    }

    if (this.areTheSame(pickedGem, this.selectedGem)) {
      this.clearSelection();
      return;
    }

    if (this.areNext(pickedGem, this.selectedGem)) {
      this.selectedGem.gemImage.setScale(1).setDepth(0);
      this.swapGems(this.selectedGem, pickedGem, true);
      return;
    }

    this.clearSelection();
    this.selectGem(pickedGem);
  }

  private selectGem(gem: GemCell): void {
    gem.gemImage.setScale(1.2).setDepth(1);
    this.selectedGem = gem;
  }

  private clearSelection(): void {
    this.selectedGem?.gemImage.setScale(1).setDepth(0);
    this.selectedGem = null;
  }

  private startSwipe(pointer: Phaser.Input.Pointer): void {
    if (!this.dragging || this.selectedGem === null) {
      return;
    }

    const deltaX = pointer.downX - pointer.x;
    const deltaY = pointer.downY - pointer.y;
    let deltaRow = 0;
    let deltaCol = 0;

    if (
      deltaX > GAME_OPTIONS.gemSize / 2 &&
      Math.abs(deltaY) < GAME_OPTIONS.gemSize / 4
    ) {
      deltaCol = -1;
    } else if (
      deltaX < -GAME_OPTIONS.gemSize / 2 &&
      Math.abs(deltaY) < GAME_OPTIONS.gemSize / 4
    ) {
      deltaCol = 1;
    } else if (
      deltaY > GAME_OPTIONS.gemSize / 2 &&
      Math.abs(deltaX) < GAME_OPTIONS.gemSize / 4
    ) {
      deltaRow = -1;
    } else if (
      deltaY < -GAME_OPTIONS.gemSize / 2 &&
      Math.abs(deltaX) < GAME_OPTIONS.gemSize / 4
    ) {
      deltaRow = 1;
    }

    if (deltaRow === 0 && deltaCol === 0) {
      return;
    }

    const selectedRow = this.getGemRow(this.selectedGem);
    const selectedCol = this.getGemCol(this.selectedGem);
    const pickedGem = this.gemAt(selectedRow + deltaRow, selectedCol + deltaCol);

    if (pickedGem !== null) {
      this.selectedGem.gemImage.setScale(1).setDepth(0);
      this.swapGems(this.selectedGem, pickedGem, true);
      this.dragging = false;
    }
  }

  private stopSwipe(): void {
    this.dragging = false;
  }

  private areTheSame(gem1: GemCell, gem2: GemCell): boolean {
    return (
      this.getGemRow(gem1) === this.getGemRow(gem2) &&
      this.getGemCol(gem1) === this.getGemCol(gem2)
    );
  }

  private getGemRow(gem: GemCell): number {
    return Math.floor(gem.gemImage.y / GAME_OPTIONS.gemSize);
  }

  private getGemCol(gem: GemCell): number {
    return Math.floor(gem.gemImage.x / GAME_OPTIONS.gemSize);
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

    this.gameArray[gem1Row][gem1Col] = {
      gemColor: gem2.gemColor,
      gemImage: gem2.gemImage,
      isEmpty: false,
    };
    this.gameArray[gem2Row][gem2Col] = {
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
      y: this.toPixel(row),
      duration: GAME_OPTIONS.swapSpeed,
      onComplete: () => {
        this.swappingGems -= 1;

        if (this.swappingGems !== 0) {
          return;
        }

        if (!this.matchInBoard() && swapBack) {
          this.swapGems(gem1, gem2, false);
        } else if (this.matchInBoard()) {
          this.handleMatches();
        } else {
          this.canPick = true;
          this.clearSelection();
        }
      },
    });
  }

  private matchInBoard(): boolean {
    for (let row = 0; row < GAME_OPTIONS.fieldSize; row += 1) {
      for (let col = 0; col < GAME_OPTIONS.fieldSize; col += 1) {
        if (this.isMatch(row, col)) {
          return true;
        }
      }
    }

    return false;
  }

  private handleMatches(): void {
    this.removeMap = Array.from({ length: GAME_OPTIONS.fieldSize }, () =>
      Array<number>(GAME_OPTIONS.fieldSize).fill(0),
    );

    this.markMatches('horizontal');
    this.markMatches('vertical');
    this.destroyGems();
  }

  private markMatches(direction: MatchDirection): void {
    for (let line = 0; line < GAME_OPTIONS.fieldSize; line += 1) {
      let streakStart = 0;

      for (let position = 1; position <= GAME_OPTIONS.fieldSize; position += 1) {
        const previous = this.gemInLine(direction, line, position - 1);
        const current = this.gemInLine(direction, line, position);
        const streakContinues =
          current !== null &&
          previous !== null &&
          !current.isEmpty &&
          !previous.isEmpty &&
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
  ): GemCell | null {
    return direction === 'horizontal'
      ? this.gemAt(line, position)
      : this.gemAt(position, line);
  }

  private destroyGems(): void {
    let remaining = this.removeMap.reduce(
      (total, row) => total + row.filter((value) => value > 0).length,
      0,
    );

    for (let row = 0; row < GAME_OPTIONS.fieldSize; row += 1) {
      for (let col = 0; col < GAME_OPTIONS.fieldSize; col += 1) {
        if (this.removeMap[row][col] === 0) {
          continue;
        }

        const cell = this.gameArray[row][col];
        cell.isEmpty = true;

        this.tweens.add({
          targets: cell.gemImage,
          alpha: 0.5,
          duration: GAME_OPTIONS.destroySpeed,
          onComplete: () => {
            remaining -= 1;
            cell.gemImage.setVisible(false);
            this.poolArray.push(cell.gemImage);

            if (remaining === 0) {
              this.makeGemsFall();
              this.replenishField();
            }
          },
        });
      }
    }
  }

  private makeGemsFall(): void {
    for (let row = GAME_OPTIONS.fieldSize - 2; row >= 0; row -= 1) {
      for (let col = 0; col < GAME_OPTIONS.fieldSize; col += 1) {
        const cell = this.gameArray[row][col];

        if (cell.isEmpty) {
          continue;
        }

        const fallTiles = this.holesBelow(row, col);
        if (fallTiles === 0) {
          continue;
        }

        this.tweens.add({
          targets: cell.gemImage,
          y: cell.gemImage.y + fallTiles * GAME_OPTIONS.gemSize,
          duration: GAME_OPTIONS.fallSpeed * fallTiles,
        });

        this.gameArray[row + fallTiles][col] = {
          gemImage: cell.gemImage,
          gemColor: cell.gemColor,
          isEmpty: false,
        };
        cell.isEmpty = true;
      }
    }
  }

  private holesBelow(row: number, col: number): number {
    let result = 0;

    for (let nextRow = row + 1; nextRow < GAME_OPTIONS.fieldSize; nextRow += 1) {
      if (this.gameArray[nextRow][col].isEmpty) {
        result += 1;
      }
    }

    return result;
  }

  private replenishField(): void {
    let remaining = 0;

    for (let col = 0; col < GAME_OPTIONS.fieldSize; col += 1) {
      const emptySpots = this.holesInColumn(col);

      for (let row = 0; row < emptySpots; row += 1) {
        const gemImage = this.poolArray.pop();
        if (gemImage === undefined) {
          throw new Error('Gem pool exhausted while replenishing the board.');
        }

        remaining += 1;

        const gemColor = Phaser.Math.Between(0, GAME_OPTIONS.gemColors - 1);
        this.gameArray[row][col] = {
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
            GAME_OPTIONS.gemSize / 2 - (emptySpots - row) * GAME_OPTIONS.gemSize,
          );

        this.tweens.add({
          targets: gemImage,
          y: this.toPixel(row),
          duration: GAME_OPTIONS.fallSpeed * emptySpots,
          onComplete: () => {
            remaining -= 1;

            if (remaining !== 0) {
              return;
            }

            if (this.matchInBoard()) {
              this.time.delayedCall(GAME_OPTIONS.cascadeDelay, () => {
                this.handleMatches();
              });
            } else {
              this.canPick = true;
              this.clearSelection();
            }
          },
        });
      }
    }
  }

  private holesInColumn(col: number): number {
    let result = 0;

    for (let row = 0; row < GAME_OPTIONS.fieldSize; row += 1) {
      if (this.gameArray[row][col].isEmpty) {
        result += 1;
      }
    }

    return result;
  }
}

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  title: 'Match 3',
  backgroundColor: '#000000',
  scale: {
    parent: 'app',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_SIZE,
    height: GAME_SIZE,
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
  scene: Match3Scene,
};

export function createGame(): Phaser.Game {
  return new Phaser.Game(gameConfig);
}
