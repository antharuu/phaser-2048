import {Scene} from 'phaser';
import {gameSize} from "../main.ts";

type Tile = {
    x: number,
    y: number,
    value: number | null,
    element: Phaser.GameObjects.Rectangle,
    textElement?: Phaser.GameObjects.Text
}

enum Direction {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right'
}

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;

    private readonly GRID_SIZE: Phaser.Math.Vector2 = new Phaser.Math.Vector2(4, 4);
    private readonly MARGIN: number = 8;

    private readonly AMOUNT_OF_STARTING_TILES: number = 2;
    private readonly STARTING_TILES_VALUES: number[] = [2, 4];

    private map: Map<string, Tile> = new Map<string, Tile>();

    private tilesMovingQueue: Array<Tile> = [];

    private readonly TILES_COLORS: Record<number, string> = {
        0: '#cdc1b4',
        2: '#eee4da',
        4: '#ede0c8',
        8: '#f2b179',
        16: '#f59563',
        32: '#f67c5f',
        64: '#f65e3b',
        128: '#edcf72',
        256: '#edcc61',
        512: '#edc850',
        1024: '#edc53f',
        2048: '#edc22e',
    };

    private isMoving: boolean;

    constructor() {
        super('Game');
    }

    // noinspection JSUnusedGlobalSymbols
    create() {
        this.camera = this.cameras.main;

        this.createGrid();
        this.startingTiles();
    }

    // noinspection JSUnusedGlobalSymbols
    update() {
        this.watchKeys();
    }

    createGrid() {
        for (let x = 0; x < this.GRID_SIZE.x; x++) {
            for (let y = 0; y < this.GRID_SIZE.y; y++) {
                const {x: xPos, y: yPos} = this.getTilePosition(x, y);
                this.createTile(xPos, yPos);
            }
        }
    }

    private createTileAt(x: number, y: number, value: number) {
        // Check if tile already exists
        if (this.map.has(`${x}__${y}`)) {
            console.error(`Tile at position ${x}__${y} already exists`);
            return;
        }

        const {x: leftPosition, y: topPosition} = this.getTilePosition(x, y);
        const element = this.createTile(leftPosition, topPosition);

        const tile: Tile = {
            x,
            y,
            value: null,
            element
        };

        this.map.set(`${x}__${y}`, tile);
        this.setTileValue(tile, value);
    }

    private getTileSize() {
        const tileSizeX = gameSize / this.GRID_SIZE.x;
        const tileSizeY = gameSize / this.GRID_SIZE.y;
        return Math.min(tileSizeX, tileSizeY) - this.MARGIN * 1.5;
    }

    private getTilePosition(x: number, y: number) {
        const tileSize = this.getTileSize();
        const leftPosition = (gameSize / 2 - this.GRID_SIZE.x * tileSize / 2) - this.MARGIN * 1.5;
        const topPosition = (gameSize / 2 - this.GRID_SIZE.y * tileSize / 2) - this.MARGIN * 1.5;

        return {
            x: leftPosition + x * tileSize + this.MARGIN * x,
            y: topPosition + y * tileSize + this.MARGIN * y
        };
    }

    private getRandomPositions(amount: number) {
        const positions = new Set<string>();

        while (positions.size < amount) {
            const x = Phaser.Math.Between(0, this.GRID_SIZE.x - 1);
            const y = Phaser.Math.Between(0, this.GRID_SIZE.y - 1);

            positions.add(`${x}__${y}`);
        }

        return positions;
    }

    private isAllFree(positions: Set<string>) {
        for (const position of positions) {
            const [x, y] = position.split('__').map(Number);
            if (this.getTileAt(x, y)) {
                return false;
            }
        }

        return true;
    }

    private getRandomEmptyPosition(amount: number) {
        // Use this.getRandomPositions, and then filter out the ones that are not empty, max 100 times
        let positions = this.getRandomPositions(amount);
        let counter = 0;

        // While is not all free and counter is less than 100, then try again
        while (!this.isAllFree(positions) && counter < 100) {
            positions = this.getRandomPositions(amount);
            counter++;
        }

        if (counter === 100) {
            this.gameOver();
        }

        console.log('Positions', ...positions);

        return positions;
    }

    private gameOver() {
        console.log('Game over');
    }

    startingTiles() {
        // Take 2 random positions
        const positions = this.getRandomPositions(this.AMOUNT_OF_STARTING_TILES);
        positions.forEach((position) => {
            const [x, y] = position.split('__').map(Number);
            this.createTileAt(x, y, Phaser.Math.RND.pick(this.STARTING_TILES_VALUES));
        });
    }

    setTileValue(tile: Tile, value: number) {
        tile.value = value;
        // Convert string color to number
        tile.element.fillColor = parseInt(this.TILES_COLORS[value].replace('#', '0x'));

        // If value is 0, make it transparent
        if (value === 0) {
            tile.element.fillColor = 0x000000;
        }

        // If value is not 0, add text
        if (value !== 0) {
            const tileSize = this.getTileSize();
            const textSize = tileSize / 2;

            const text = this.add.text(
                tile.element.x + tileSize / 2,
                tile.element.y + tileSize / 2,
                value.toString(),
                {
                    fontSize: `${textSize}px`,
                    color: value < 8 ? '#776e65' : '#f9f6f2',
                    align: 'center',
                    fontFamily: 'Arial',
                }
            );

            text.setOrigin(0.5, 0.5);

            tile.textElement = text;
        }
    }

    createTile(x: number, y: number) {
        const tileSize = this.getTileSize();
        const color = this.TILES_COLORS[0];
        const colorNumber = parseInt(color.replace('#', '0x'));
        const square =
            this.add.rectangle(x, y, tileSize, tileSize, colorNumber);

        square.setOrigin(0, 0);

        return square;
    }

    watchKeys() {
        if (!this.input || !this.input.keyboard) {
            return;
        }

        const cursors = this.input.keyboard.createCursorKeys();
        cursors.up.on('down', () => this.move(Direction.UP));
        cursors.down.on('down', () => this.move(Direction.DOWN));
        cursors.left.on('down', () => this.move(Direction.LEFT));
        cursors.right.on('down', () => this.move(Direction.RIGHT));
    }

    getTileAt(x: number, y: number) {
        return this.map.get(`${x}__${y}`);
    }

    getDirectionVector(direction: Direction): { x: number, y: number } {
        if (direction === Direction.UP) {
            return {x: 0, y: -1};
        }
        if (direction === Direction.DOWN) {
            return {x: 0, y: 1};
        }
        if (direction === Direction.LEFT) {
            return {x: -1, y: 0};
        }
        if (direction === Direction.RIGHT) {
            return {x: 1, y: 0};
        }

        return {x: 0, y: 0};
    }

    getPositionAtDirection(x: number, y: number, direction: Direction, steps: number): { x: number, y: number } | null {
        const vector = this.getDirectionVector(direction);
        const newX = x + vector.x * steps;
        const newY = y + vector.y * steps;
        return {x: newX, y: newY};
    }

    getAtDirection(x: number, y: number, direction: Direction): { x: number, y: number, merge: boolean } | null {
        const positionAtDirection: { x: number, y: number }[] = [];
        const vector = this.getDirectionVector(direction);

        // This loop will now move in the direction correctly and stop at the boundaries
        let currentX = x;
        let currentY = y;
        while (currentX + vector.x >= 0 && currentX + vector.x < this.GRID_SIZE.x && currentY + vector.y >= 0 && currentY + vector.y < this.GRID_SIZE.y) {
            currentX += vector.x;
            currentY += vector.y;
            positionAtDirection.push({x: currentX, y: currentY});
        }

        const tilesAtDirection = positionAtDirection
            .map(({x, y}) => this.getTileAt(x, y))
            .map((tile) => tile ?? null);

        // Correct handling of last valid tile index
        let lastValidTileIndex = 0;
        let tileAtLastValidIndex = tilesAtDirection[lastValidTileIndex];
        let valueToMerge = this.getTileAt(x, y)?.value ?? null;
        if (!valueToMerge) {
            throw new Error(`Tile at ${x}__${y} has no value`);
        }

        let merge = false;

        // Ensure that we do not access out of bounds and stop at the first non-null tile
        while (
            // If value is not the same as the one we are trying to merge
        (!merge && tileAtLastValidIndex?.value === valueToMerge)

        // Check if we are not out of bounds and the tile is null
        || (lastValidTileIndex < tilesAtDirection.length && tilesAtDirection[lastValidTileIndex] === null)
            ) {
            lastValidTileIndex++;
            tileAtLastValidIndex = tilesAtDirection[lastValidTileIndex];
            merge = tileAtLastValidIndex?.value === valueToMerge
        }

        const posAtDirection = this.getPositionAtDirection(x, y, direction, lastValidTileIndex);

        return posAtDirection ? {
            x: merge ? posAtDirection.x + vector.x :posAtDirection.x,
            y: merge ? posAtDirection.y + vector.y : posAtDirection.y,
            merge
        } : null;
    }

    async move(direction: Direction) {
        if (this.isMoving) {
            return;
        }

        this.isMoving = true;
        // Get all tiles
        const tiles = Array.from(this.map.values());
        this.sortTilesByDirection(tiles, direction);

        // For each tile, check where it can move
        for (const tile of tiles) {
            const {x, y} = tile;
            const value = tile.value;

            if (!value) {
                console.error(`Tile at ${x}__${y} has no value`);
                this.isMoving = false;
                continue;
            }

            const nextTile = this.getAtDirection(x, y, direction);
            if (!nextTile) {
                this.isMoving = false;
                continue;
            }

            this.tilesMovingQueue.push(tile);
            await this.moveTileTo(tile, nextTile.x, nextTile.y, nextTile.merge, {x, y});
        }
    }

    mergeTile(tile: Tile, nextTile: { x: number, y: number }) {
        console.log(tile, nextTile);
        const nextTileValue = this.getTileAt(nextTile.x, nextTile.y)?.value ?? null;
        if (!nextTileValue) {
            throw new Error(`Tile at ${nextTile.x}__${nextTile.y} has no value`);
        }

        console.log(`Merging tile at ${tile.x}__${tile.y} with tile at ${nextTile.x}__${nextTile.y}`);
    }

    private sortTilesByDirection(tiles: Array<Tile>, direction: Direction) {
        tiles.sort((a, b) => {
            if (direction === Direction.UP) {
                return a.y - b.y;
            }
            if (direction === Direction.DOWN) {
                return b.y - a.y;
            }
            if (direction === Direction.LEFT) {
                return a.x - b.x;
            }
            if (direction === Direction.RIGHT) {
                return b.x - a.x;
            }
            return 0;
        });
    }

    async moveTileTo(tile: Tile, x: number, y: number, merge: boolean, oldTilePosition?: { x: number, y: number }) {
        const {x: leftPosition, y: topPosition} = this.getTilePosition(x, y);

        // Move tile to new position with animation
        this.tweens.add({
            targets: tile.element,
            x: leftPosition,
            y: topPosition,
            duration: 200,
            ease: 'Power2'
        }).on('complete', async () => {
            this.tilesMovingQueue = this.tilesMovingQueue.filter((t) => t !== tile);

            console.log(merge, oldTilePosition);
            if(merge && oldTilePosition) {
                this.mergeTile(tile, oldTilePosition);
            }

            this.map.delete(`${tile.x}__${tile.y}`);

            if (this.tilesMovingQueue.length === 0) {
                await this.afterMove();

                this.isMoving = false;
            }

            // Update tile position
            tile.x = x;
            tile.y = y;

            // Update map
            this.map.set(`${x}__${y}`, tile);
        });

        // Move text to new position with same animation
        if (tile.textElement) {
            this.tweens.add({
                targets: tile.textElement,
                x: leftPosition + this.getTileSize() / 2,
                y: topPosition + this.getTileSize() / 2,
                duration: 200,
                ease: 'Power2',
            });
        }
    }

    async wait(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    private async afterMove() {
        const amountOfNewTiles = Math.random() > 0.8 ? 2 : 1;
        const positions = this.getRandomEmptyPosition(amountOfNewTiles);

        await this.wait(25)

        for (const position of positions) {
            const [x, y] = position.split('__').map(Number);
            console.log(`Creating tile at ${x}__${y}`);
            this.createTileAt(x, y, Phaser.Math.RND.pick(this.STARTING_TILES_VALUES));

            await this.wait(25)
        }

        await this.wait(25)
    }
}
