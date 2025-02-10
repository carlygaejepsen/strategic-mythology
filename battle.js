// battle.js - Handles battle logic and combat mechanics

import {
  currentPlayerBattleCards,
  currentEnemyBattleCards,
  playerHand,
  enemyHand
} from "./cards.js";

import {
  battleSystem,
  gameConfig
} from "./config.js";

import {
  logToResults,
  updateBattleZones,
  removeDefeatedCards
} from "./display.js";

function battleRound() {
  // Ensure both players have an active character card
  if (!currentPlayerBattleCards?.char || !currentEnemyBattleCards?.char) {
    logToResults("❌ No active cards in the battle zone! Waiting for selections...");
    console.log("Debug: currentPlayerBattleCards ->", currentPlayerBattleCards);
    console.log("Debug: currentEnemyBattleCards ->", currentEnemyBattleCards);
    return;
  }

  logToResults(`⚔️ ${currentPlayerBattleCards.char.name} vs ${currentEnemyBattleCards.char.name} begins!`);

  // 1️⃣ Character vs Character Combat
  processCombat(currentPlayerBattleCards.char, currentEnemyBattleCards.char);

  // 2️⃣ Essence vs Essence (if both have one)
  if (currentPlayerBattleCards.essence && currentEnemyBattleCards.essence) {
    processCombat(currentPlayerBattleCards.essence, currentEnemyBattleCards.essence);
  }

  // 3️⃣ Player’s Essence & Ability Attacks Enemy Character
  if (currentPlayerBattleCards.essence) {
    processCombat(currentPlayerBattleCards.essence, currentEnemyBattleCards.char);
  }
  if (currentPlayerBattleCards.ability) {
    processCombat(currentPlayerBattleCards.ability, currentEnemyBattleCards.char);
  }

  // 4️⃣ Enemy’s Essence & Ability Attacks Player Character
  if (currentEnemyBattleCards.essence) {
    processCombat(currentEnemyBattleCards.essence, currentPlayerBattleCards.char);
  }
  if (currentEnemyBattleCards.ability) {
    processCombat(currentEnemyBattleCards.ability, currentPlayerBattleCards.char);
  }

  // Remove any defeated cards and update the UI
  removeDefeatedCards();
}

function processCombat(attacker, defender) {
  if (!attacker?.name || !defender?.name) {
    console.error("❌ ERROR: Invalid attacker or defender!", { attacker, defender });
    return;
  }

  // Log the basic attack event
  logToResults(`${attacker.name} attacks ${defender.name}!`);

  // Some cards (essence/ability) might have no ATK
  let attackPower = attacker.atk ?? 0;
  if (attackPower === 0) {
    logToResults(`⚠️ ${attacker.name} has no attack power and does no damage.`);
    return;
  }

  let essenceMultiplier = 1;
  let classMultiplier = 1;

  // 🌟 Essence multiplier
  if (attacker.essence && defender.essence) {
    const attackerEss = attacker.essence;
    const defenderEss = defender.essence;
    if (battleSystem.essenceBonuses?.[attackerEss]?.strongAgainst === defenderEss) {
      essenceMultiplier = battleSystem.damageCalculation.essenceBonusMultiplier;
    } else if (battleSystem.essenceBonuses?.[attackerEss]?.weakAgainst === defenderEss) {
      essenceMultiplier = 1 / battleSystem.damageCalculation.essenceBonusMultiplier;
    }
  }

  // 🌟 Class multiplier
  if (attacker.class && defender.class) {
    const attackerClass = attacker.class;
    const defenderClass = defender.class;
    if (battleSystem.classBonuses?.[attackerClass]?.strongAgainst?.includes(defenderClass)) {
      classMultiplier = battleSystem.damageCalculation.classBonusMultiplier;
    } else if (battleSystem.classBonuses?.[attackerClass]?.weakAgainst?.includes(defenderClass)) {
      classMultiplier = 1 / battleSystem.damageCalculation.classBonusMultiplier;
    }
  }

  // Calculate final damage
  let baseDamage = Math.max(
    (attackPower * essenceMultiplier * classMultiplier) - (defender.def ?? 0),
    battleSystem.damageCalculation.minDamage
  );

  baseDamage = Math.round(baseDamage);
  defender.hp -= baseDamage;

  logToResults(`${attacker.name} deals ${baseDamage} damage to ${defender.name}!`);
}

// Attach event listener after the DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const playTurnButton = document.getElementById("play-turn");
  if (playTurnButton) {
    playTurnButton.addEventListener("click", battleRound);
  } else {
    console.error("❌ ERROR: 'Play Turn' button not found!");
  }
});

export { battleRound };
