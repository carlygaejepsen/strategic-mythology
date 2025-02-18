const { expect } = require('chai');
const { JSDOM } = require('jsdom');
const { updateEnemyBattleCard } = require('./update'); // Adjust the path as necessary
const { currentEnemyBattleCards } = require('./config'); // Adjust the path as necessary

// Set up a simulated DOM environment
const { window } = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global.document = window.document;

describe('updateEnemyBattleCard', () => {
  beforeEach(() => {
    // Reset the currentEnemyBattleCards before each test
    for (let key in currentEnemyBattleCards) {
      delete currentEnemyBattleCards[key];
    }
  });

  it('should update the enemy battle card correctly', () => {
    const card = { id: 1, name: 'Enemy Card', type: 'char' };
    const type = 'char';
    updateEnemyBattleCard(card, type);
    expect(currentEnemyBattleCards[type]).to.deep.equal(card);
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