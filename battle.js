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

let gameRunning = false;
//gameLoop 3.0
function gameLoop() {
    if (gameRunning) return; // Prevents multiple triggers
    gameRunning = true;

    console.log("🔄 New battle round starting...");

    battleRound(); // ✅ Runs only ONCE per turn

    setTimeout(() => {
        // ✅ Stop looping if a deck is empty
        if (playerDeck.length === 0 || enemyDeck.length === 0) {
            logToResults(playerDeck.length === 0 ? "🏁 Player wins!" : "🏁 Enemy wins!");
            gameRunning = false;
            return;
        }

        // ✅ Ensure the next turn waits for "Play Turn" click
        gameRunning = false;
    }, 1000);
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
//Battle Round 3.0
let selectedAttacker = null;
let selectedDefender = null;

function battleRound() {
    console.log("⚔️ Battle round begins!");
    
    if (!selectedAttacker || !selectedDefender) {
        console.warn("⚠️ Player must select an attacker and a defender before continuing.");
        return;
    }

    // 🛡️ Player's Turn (Selected Attacker vs Selected Defender)
    processCombat(selectedAttacker, selectedDefender);

    // 🤖 Enemy AI Turn (Auto-Attacks Random Player Card)
    const enemyAttacker = getRandomCardFromZone(currentEnemyBattleCards);
    const playerDefender = getRandomCardFromZone(currentPlayerBattleCards);
    
    if (enemyAttacker && playerDefender) {
        processCombat(enemyAttacker, playerDefender);
        console.log(`🤖 Enemy AI: ${enemyAttacker.name} attacks ${playerDefender.name}`);
    }

    removeDefeatedCards(); // ✅ Only removes defeated cards (DOES NOT clear entire battle zone)
    drawCardsToFillHands(); // ✅ Players and enemies draw one new card to their hand (if space)

    // Reset selections for next turn
    selectedAttacker = null;
    selectedDefender = null;

    console.log("✅ Battle round complete. Click 'Play Turn' to continue.");
}

// 📌 Helper: Gets a random card from a battle zone
function getRandomCardFromZone(battleZone) {
    const availableCards = Object.values(battleZone).filter(card => card !== null);
    return availableCards.length > 0 ? availableCards[Math.floor(Math.random() * availableCards.length)] : null;
}

// Modified processCombat with combo support
function processCombat(attacker, defender, isCombo = false) {
  if (!attacker?.name || !defender?.name) return;
  if (attacker === defender) {
    console.error(`🚨 ERROR: ${attacker.name} is trying to attack itself! Skipping attack.`);
    return;
  }

  let attackPower = attacker.atk || 0;
  if (isCombo && ['essence', 'ability'].includes(determineCardType(attacker))) {
    attackPower *= 2;
    logToResults(`🔥 Combo boost for ${attacker.name}!`);
  }

  // Damage multipliers
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
// Event listener
document.addEventListener("DOMContentLoaded", () => {
  const playTurnButton = document.getElementById("play-turn");
  if (playTurnButton) {
    playTurnButton.addEventListener("click", gameLoop);
  }
});

export { battleRound };