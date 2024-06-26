import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { Preloader } from './scenes/Preloader';

import { Game, type Types } from "phaser";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
export const gameSize = 720;

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: gameSize,
    height: gameSize,
    parent: 'game-container',
    backgroundColor: '#bbada0',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainGame,
    ]
};

export default new Game(config);
