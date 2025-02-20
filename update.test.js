const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');
const { updateEnemyBattleCard } = require('./update'); // Adjust the path as necessary
const { currentEnemyBattleCards, setDebugMode } = require('./config'); // Adjust the path as necessary
const { logError, logDebug } = require('./utils/logger'); // Ensure proper import

describe('updateEnemyBattleCard', () => {
    let dom;

    beforeEach(() => {
        // Set up a virtual DOM
        dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
        global.window = dom.window;
        global.document = dom.window.document;

        setDebugMode(true); // Enable debug mode for tests

        sinon.stub(logError); // Ensure logError is stubbed
    });

    afterEach(() => {
        sinon.restore();
        dom.window.close();
    });

    it('should update the enemy battle card correctly', () => {
        const card = { id: 1, name: 'Test Card', type: 'char', hp: 100 };
        const type = 'char';

        updateEnemyBattleCard(card, type);

        expect(currentEnemyBattleCards[type]).to.equal(card);
    });

    it('should handle null card correctly', () => {
        const type = 'char';
        updateEnemyBattleCard(null, type);
        expect(currentEnemyBattleCards[type]).to.be.null;
    });

    it('should update different card types correctly', () => {
        const charCard = { id: 1, name: 'Char Card', type: 'char' };
        const abilityCard = { id: 2, name: 'Ability Card', type: 'ability' };
        const essenceCard = { id: 3, name: 'Essence Card', type: 'essence' };

        updateEnemyBattleCard(charCard, 'char');
        updateEnemyBattleCard(abilityCard, 'ability');
        updateEnemyBattleCard(essenceCard, 'essence');

        expect(currentEnemyBattleCards['char']).to.deep.equal(charCard);
        expect(currentEnemyBattleCards['ability']).to.deep.equal(abilityCard);
        expect(currentEnemyBattleCards['essence']).to.deep.equal(essenceCard);
    });

    it('should update an existing card correctly', () => {
        const initialCard = { id: 1, name: 'Initial Card', type: 'char' };
        const updatedCard = { id: 1, name: 'Updated Card', type: 'char' };

        updateEnemyBattleCard(initialCard, 'char');
        expect(currentEnemyBattleCards['char']).to.deep.equal(initialCard);

        updateEnemyBattleCard(updatedCard, 'char');
        expect(currentEnemyBattleCards['char']).to.deep.equal(updatedCard);
    });

    // Add more tests as needed
});