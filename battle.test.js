const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');
const { manageTurn, startGame } = require('./battle');
const { gameState, playerDeck, enemyDeck, playerHand, enemyHand, setDebugMode } = require('./config');
const { enemyPlaceCard, resetSelections, drawCardsToFillHands } = require('./update');
const { logError, logToResults, logDebug } = require('./utils/logger'); // Ensure proper import

describe('manageTurn', () => {
    let dom;

    beforeEach(() => {
        // Set up a virtual DOM
        dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
        global.window = dom.window;
        global.document = dom.window.document;

        setDebugMode(true); // Enable debug mode for tests

        gameState.playerHasPlacedCard = false;
        gameState.enemyHasPlacedCard = false;
        playerDeck.length = 5;
        playerHand.length = 0;
        enemyHand.length = 0;
        sinon.stub(enemyPlaceCard).resolves(); // Ensure resolves method is used correctly
        sinon.stub(resetSelections).resolves();
        sinon.stub(drawCardsToFillHands).resolves();
        sinon.stub(logError);
        sinon.stub(logToResults);
    });

    afterEach(() => {
        sinon.restore();
        dom.window.close();
    });

    it('should reset gameState flags at the end of the turn', async () => {
        await manageTurn();

        expect(gameState.playerHasPlacedCard).to.be.false;
        expect(gameState.enemyHasPlacedCard).to.be.false;
    });

    it('should log an error if enemyPlaceCard fails', async () => {
        const error = new Error('Test error');
        enemyPlaceCard.rejects(error);

        await manageTurn();

        expect(logError.calledWith(`❌ Error during enemyPlaceCard: ${error}`)).to.be.true;
    });

    it('should log a draw if both decks are empty', async () => {
        playerDeck.length = 0;
        enemyDeck.length = 0;

        await manageTurn();

        expect(logToResults.calledWith("🏁 It's a draw!")).to.be.true;
    });

    it('should call battleRound if both players have placed cards', async () => {
        gameState.playerHasPlacedCard = true;
        gameState.enemyHasPlacedCard = true;

        const battleRound = sinon.stub().resolves();
        sinon.replace(require('./battle'), 'battleRound', battleRound);

        await manageTurn();

        expect(battleRound.called).to.be.true;
    });

    it('should allow placing a card in the battle zone on the second turn', async () => {
        // Simulate the first turn
        gameState.playerHasPlacedCard = true;
        gameState.enemyHasPlacedCard = true;
        await manageTurn();

        // Simulate the start of the second turn
        gameState.playerHasPlacedCard = false;
        gameState.enemyHasPlacedCard = false;

        // Attempt to place a card in the battle zone
        const placeCardInBattleZone = sinon.stub().resolves();
        sinon.replace(require('./update'), 'placeCardInBattleZone', placeCardInBattleZone);

        await manageTurn();

        expect(placeCardInBattleZone.called).to.be.true;
    });

    it('should reset game state correctly at the start of each turn', async () => {
        // Simulate the first turn
        gameState.playerHasPlacedCard = true;
        gameState.enemyHasPlacedCard = true;
        await manageTurn();

        // Check if game state flags are reset
        expect(gameState.playerHasPlacedCard).to.be.false;
        expect(gameState.enemyHasPlacedCard).to.be.false;

        // Simulate the second turn
        gameState.playerHasPlacedCard = false;
        gameState.enemyHasPlacedCard = false;
        await manageTurn();

        // Check if game state flags are reset again
        expect(gameState.playerHasPlacedCard).to.be.false;
        expect(gameState.enemyHasPlacedCard).to.be.false;
    });
});