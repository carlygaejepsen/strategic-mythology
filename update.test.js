import { expect } from 'chai';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import * as update from './update.js';
import * as config from './config.js';
import * as logger from './utils/logger.js';

describe('updateEnemyBattleCard', () => {
    let dom;

    beforeEach(() => {
        // Set up a virtual DOM
        dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
        global.window = dom.window;
        global.document = dom.window.document;

        config.setDebugMode(true); // Enable debug mode for tests

        sinon.stub(logger, 'logError'); // Ensure logError is stubbed
    });

    afterEach(() => {
        sinon.restore();
        dom.window.close();
    });

    it('should update the enemy battle card correctly', () => {
        const card = { id: 1, name: 'Test Card', type: 'char', hp: 100 };
        const type = 'char';

        update.updateEnemyBattleCard(card, type);

        expect(config.currentEnemyBattleCards[type]).to.equal(card);
    });

    it('should handle invalid card type correctly', () => {
        const card = { id: 1, name: 'Test Card', type: 'invalid' };
        update.updateEnemyBattleCard(card, 'invalid');
        expect(logger.logError.called).to.be.true;
    });

    it('should update different card types correctly', () => {
        const charCard = { id: 1, name: 'Char Card', type: 'char' };
        const abilityCard = { id: 2, name: 'Ability Card', type: 'ability' };
        const essenceCard = { id: 3, name: 'Essence Card', type: 'essence' };

        update.updateEnemyBattleCard(charCard, 'char');
        update.updateEnemyBattleCard(abilityCard, 'ability');
        update.updateEnemyBattleCard(essenceCard, 'essence');

        expect(config.currentEnemyBattleCards['char']).to.deep.equal(charCard);
        expect(config.currentEnemyBattleCards['ability']).to.deep.equal(abilityCard);
        expect(config.currentEnemyBattleCards['essence']).to.deep.equal(essenceCard);
    });
});
