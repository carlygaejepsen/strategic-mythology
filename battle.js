// battle.js - Handles battle logic and combat mechanics
import {
  currentPlayerBattleCards,
  currentEnemyBattleCards,
  playerHand,
  enemyHand,
  playerDeck,
  enemyDeck,
  determineCardType
} from "./cards.js";

import {
  battleSystem,
  gameConfig
} from "./config.js";

import {
  logToResults,
  updateBattleZones,
  removeDefeatedCards,
  updateHands,
  placeCardInBattleZone
} from "./display.js";

function gameLoop() {
    if (!gameRunning) {
        gameRunning = true;
        battleRound();
        gameRunning = false;
    }
}

function checkForCombos(battleZone, owner) {
  const cards = Object.values(battleZone).filter(card => card !== null);
  let comboFound = false;

  // Check class combos
  const classMap = {};
  cards.forEach(card => {
    if (card.classes) {
      card.classes.forEach(cls => {
        if (classMap[cls]) {
          logToResults(`🔥 ${owner} class combo: ${classMap[cls].name} + ${card.name}`);
          comboFound = true;
        } else {
          classMap[cls] = card;
        }
      });
    }
  });

  // Check essence combos
  const essenceMap = {};
  cards.forEach(card => {
    if (card.essence) {
      if (essenceMap[card.essence]) {
        logToResults(`🔥 ${owner} essence combo: ${essenceMap[card.essence].name} + ${card.name}`);
        comboFound = true;
      } else {
        essenceMap[card.essence] = card;
      }
    }
  });

  return comboFound;
}

function checkForTripleCombo(battleZone, owner) {
  const types = ['char', 'essence', 'ability'];
  const hasAllTypes = types.every(type => battleZone[type]);
  if (hasAllTypes) logToResults(`⚡ ${owner} activated TRIPLE COMBO!`);
  return hasAllTypes;
}

function performTripleCombo(owner, opponentBattleZone) {
  const damage = 60;
  Object.values(opponentBattleZone).forEach(card => {
    if (card) {
      card.hp -= damage;
      logToResults(`💥 ${owner}'s triple combo hits ${card.name} for ${damage}!`);
    }
  });
}

function drawCardsToFillHands() {
  // Player draw
  if (playerHand.length < 6 && playerDeck.length > 0) {
    const drawn = playerDeck.shift();
    playerHand.push(drawn);
    logToResults(`🃏 Player draws ${drawn.name}`);
  }

  // Enemy draw
  if (enemyHand.length < 6 && enemyDeck.length > 0) {
    const drawn = enemyDeck.shift();
    enemyHand.push(drawn);
    logToResults(`🃏 Enemy draws ${drawn.name}`);
  }
  updateHands();
}

// Updated battle logic
function battleRound() {
  // Check for triple combos first
  if (checkForTripleCombo(currentPlayerBattleCards, "Player")) {
    performTripleCombo("Player", currentEnemyBattleCards);
  }
  if (checkForTripleCombo(currentEnemyBattleCards, "Enemy")) {
    performTripleCombo("Enemy", currentPlayerBattleCards);
  }

  // Process individual attacks
  [currentPlayerBattleCards, currentEnemyBattleCards].forEach((battleZone, isPlayer) => {
    const owner = isPlayer ? "Player" : "Enemy";
    Object.values(battleZone).forEach(card => {
      if (!card) return;
      
      const comboActive = checkForCombos(battleZone, owner);
      const defenderZone = isPlayer ? currentEnemyBattleCards : currentPlayerBattleCards;
      let target = Object.values(defenderZone).find(c => c) || 
                  (isPlayer ? enemyHand : playerHand).find(c => c);

      if (target) {
        processCombat(card, target, comboActive);
      }
    });
  });

  removeDefeatedCards();
  drawCardsToFillHands();
}

// Modified processCombat with combo support
function processCombat(attacker, defender, isCombo = false) {
  if (!attacker?.name || !defender?.name) return;

  let attackPower = attacker.atk || 0;
  if (isCombo && ['essence', 'ability'].includes(determineCardType(attacker))) {
    attackPower *= 2;
    logToResults(`🔥 Combo boost for ${attacker.name}!`);
  }

  // Existing damage calculation
  let essenceMultiplier = 1;
  let classMultiplier = 1;

  if (attacker.essence && defender.essence) {
    const attackerEss = attacker.essence;
    const defenderEss = defender.essence;
    if (battleSystem.essenceBonuses?.[attackerEss]?.strongAgainst === defenderEss) {
      essenceMultiplier = battleSystem.damageCalculation.essenceBonusMultiplier;
    } else if (battleSystem.essenceBonuses?.[attackerEss]?.weakAgainst === defenderEss) {
      essenceMultiplier = 1 / battleSystem.damageCalculation.essenceBonusMultiplier;
    }
  }

  if (attacker.class && defender.class) {
    const attackerClass = attacker.class;
    const defenderClass = defender.class;
    if (battleSystem.classBonuses?.[attackerClass]?.strongAgainst?.includes(defenderClass)) {
      classMultiplier = battleSystem.damageCalculation.classBonusMultiplier;
    } else if (battleSystem.classBonuses?.[attackerClass]?.weakAgainst?.includes(defenderClass)) {
      classMultiplier = 1 / battleSystem.damageCalculation.classBonusMultiplier;
    }
  }

  const baseDamage = Math.max(
    Math.round((attackPower * essenceMultiplier * classMultiplier) - (defender.def || 0)),
    battleSystem.damageCalculation.minDamage
  );

  defender.hp -= baseDamage;
  logToResults(`${attacker.name} hits ${defender.name} for ${baseDamage} damage!`);
}

// Game loop control
let gameRunning = false;
function gameLoop() {
  if (!gameRunning && (playerDeck.length > 0 && enemyDeck.length > 0)) {
    gameRunning = true;
    while (playerDeck.length > 0 && enemyDeck.length > 0) {
      battleRound();
    }
    gameRunning = false;
    logToResults(playerDeck.length === 0 ? "🏁 Player wins!" : "🏁 Enemy wins!");
  }
}

// Updated event listener
document.addEventListener("DOMContentLoaded", () => {
  const playTurnButton = document.getElementById("play-turn");
  if (playTurnButton) {
    playTurnButton.addEventListener("click", gameLoop);
  }
});

export { battleRound };