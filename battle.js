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
    if (!currentPlayerBattleCards?.char || !currentEnemyBattleCards?.char) {
        logToResults("❌ No active cards in the battle zone! Waiting for selections...");
        console.log("Debug: currentPlayerBattleCards ->", currentPlayerBattleCards);
        console.log("Debug: currentEnemyBattleCards ->", currentEnemyBattleCards);
        return;
    }

    logToResults(`⚔️ ${currentPlayerBattleCards.char.name} vs ${currentEnemyBattleCards.char.name} begins!`);

    // 🌟 Character vs Character Combat
    processCombat(currentPlayerBattleCards.char, currentEnemyBattleCards.char);

    // 🌟 Essence vs Essence (if both have one)
    if (currentPlayerBattleCards.essence && currentEnemyBattleCards.essence) {
        processCombat(currentPlayerBattleCards.essence, currentEnemyBattleCards.essence);
    }

    // 🌟 Player’s Essence & Ability Affecting the Enemy Character
    if (currentPlayerBattleCards.essence) {
        processCombat(currentPlayerBattleCards.essence, currentEnemyBattleCards.char);
    }
    if (currentPlayerBattleCards.ability) {
        processCombat(currentPlayerBattleCards.ability, currentEnemyBattleCards.char);
    }

    // 🌟 Enemy’s Essence & Ability Affecting the Player Character
    if (currentEnemyBattleCards.essence) {
        processCombat(currentEnemyBattleCards.essence, currentPlayerBattleCards.char);
    }
    if (currentEnemyBattleCards.ability) {
        processCombat(currentEnemyBattleCards.ability, currentPlayerBattleCards.char);
    }

    removeDefeatedCards();
}

function processCombat(attacker, defender) {
    if (!attacker?.name || !defender?.name) {
        console.error("❌ ERROR: Invalid attacker or defender!", { attacker, defender });
        return;
    }

    // 🌟 Log the attack event
    logToResults(`${attacker.name} attacks ${defender.name}!`);

    // ✅ Essence & Ability Cards Might Not Have ATK
    let attackPower = attacker.atk ?? 0;
    if (attackPower === 0) {
        logToResults(`⚠️ ${attacker.name} has no attack power and does no damage.`);
        return;
    }

    let essenceMultiplier = 1;
    let classMultiplier = 1;

    // 🌟 Apply Essence Bonus
    if (attacker.essence && defender.essence) {
        if (battleSystem.essenceBonuses?.[attacker.essence]?.strongAgainst === defender.essence) {
            essenceMultiplier = battleSystem.damageCalculation.essenceBonusMultiplier;
        } else if (battleSystem.essenceBonuses?.[attacker.essence]?.weakAgainst === defender.essence) {
            essenceMultiplier = 1 / battleSystem.damageCalculation.essenceBonusMultiplier;
        }
    }

    // 🌟 Apply Class Bonus
    if (attacker.class && defender.class) {
        if (battleSystem.classBonuses?.[attacker.class]?.strongAgainst?.includes(defender.class)) {
            classMultiplier = battleSystem.damageCalculation.classBonusMultiplier;
        } else if (battleSystem.classBonuses?.[attacker.class]?.weakAgainst?.includes(defender.class)) {
            classMultiplier = 1 / battleSystem.damageCalculation.classBonusMultiplier;
        }
    }

    // 🌟 Calculate Damage
    let baseDamage = Math.max(
        (attackPower * essenceMultiplier * classMultiplier) - (defender.def ?? 0),
        battleSystem.damageCalculation.minDamage
    );

    baseDamage = Math.round(baseDamage);
    defender.hp -= baseDamage;

    logToResults(`${attacker.name} deals ${baseDamage} damage to ${defender.name}!`);
}

// ✅ Attach event listener after the DOM loads
document.addEventListener("DOMContentLoaded", () => {
    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", battleRound);
    } else {
        console.error("❌ ERROR: 'Play Turn' button not found!");
    }
});

export { battleRound };
