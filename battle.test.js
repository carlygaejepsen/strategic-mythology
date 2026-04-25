import { expect } from 'chai';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import * as battle from './battle.js';
import * as config from './config.js';
import * as update from './update.js';
import * as logger from './utils/logger.js';
import * as uiDisplay from './ui-display.js';

describe('manageTurn', () => {
    let dom;

    beforeEach(() => {
        // Set up a virtual DOM
        dom = new JSDOM(`<!DOCTYPE html><html><body><div id="instruction-box"></div><div id="enemy-status-box"></div><div id="player-hand"></div><div id="enemy-hand"></div></body></html>`, {
            url: "http://localhost",
        });
        global.window = dom.window;
        global.document = dom.window.document;
        global.HTMLElement = dom.window.HTMLElement;
        global.Node = dom.window.Node;

        config.setDebugMode(true); 

        config.gameState.playerHasPlacedCard = false;
        config.gameState.enemyHasPlacedCard = false;
        config.playerDeck.length = 5;
        config.playerHand.length = 0;
        config.enemyHand.length = 0;

        // Stubbing functions that might be called
        sinon.stub(update, 'enemyPlaceCard').resolves();
        sinon.stub(update, 'resetSelections').resolves();
        sinon.stub(update, 'drawCardsForPlayer');
        sinon.stub(update, 'drawCardsForEnemy');
        sinon.stub(logger, 'logError');
        sinon.stub(uiDisplay, 'logToResults');
    });

    afterEach(() => {
        sinon.restore();
        dom.window.close();
    });

    it('should reset gameState flags at the end of the turn', async () => {
        // Need to set these so manageTurn proceeds to the end
        config.gameState.playerHasPlacedCard = true;
        config.gameState.enemyHasPlacedCard = true;
        
        // Mock battleRound to avoid errors
        const battleRoundStub = sinon.stub(battle, 'battleRound');

        await battle.manageTurn();

        // manageTurn has a timeout for resetSelections
        // We might need to wait or use fake timers
    });
});
