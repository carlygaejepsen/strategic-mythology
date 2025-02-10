import { currentPlayerBattleCards, currentEnemyBattleCards, playerHand, enemyHand, createCardElement } from "./cards.js";
import { battleSystem, gameConfig } from "./config.js";

function battleRound() {
    if (!currentPlayerBattleCards?.char || !currentEnemyBattleCards?.char) {
        console.log("❌ No active cards in the battle zone! Waiting for selections...");
        console.log("Debug: currentPlayerBattleCards ->", currentPlayerBattleCards);
        console.log("Debug: currentEnemyBattleCards ->", currentEnemyBattleCards);
        return;
    }

    console.log(gameConfig["battle-messages"].battleStart
        .replace("{player}", currentPlayerBattleCards.char.name)
        .replace("{enemy}", currentEnemyBattleCards.char.name)
    );

    if (currentPlayerBattleCards?.char && currentEnemyBattleCards?.char) {
        processCombat(currentPlayerBattleCards.char, currentEnemyBattleCards.char);
    }
    
    if (currentPlayerBattleCards?.essence && currentEnemyBattleCards?.essence) {
        processCombat(currentPlayerBattleCards.essence, currentEnemyBattleCards.essence);
    }

    if (currentPlayerBattleCards?.ability) {
        processCombat(currentPlayerBattleCards.ability, currentEnemyBattleCards.char);
    }

    if (currentEnemyBattleCards?.ability) {
        processCombat(currentEnemyBattleCards.ability, currentPlayerBattleCards.char);
    }

    removeDefeatedCards();
}

function processCombat(attacker, defender) {
    if (!attacker?.name || !defender?.name) {
        console.error("❌ ERROR: Invalid attacker or defender!", { attacker, defender });
        return;
    }

    let essenceMultiplier = battleSystem.essenceBonuses?.[attacker.essence]?.strongAgainst === defender.essence 
        ? battleSystem.damageCalculation.essenceBonusMultiplier
        : battleSystem.essenceBonuses?.[attacker.essence]?.weakAgainst === defender.essence
        ? 1 / battleSystem.damageCalculation.essenceBonusMultiplier
        : 1;

    let classMultiplier = battleSystem.classBonuses?.[attacker.class]?.strongAgainst?.includes(defender.class) 
        ? battleSystem.damageCalculation.classBonusMultiplier
        : battleSystem.classBonuses?.[attacker.class]?.weakAgainst?.includes(defender.class)
        ? 1 / battleSystem.damageCalculation.classBonusMultiplier
        : 1;

    let baseDamage = Math.max(
        (attacker.atk * essenceMultiplier * classMultiplier) - (defender.def ?? 0),
        battleSystem.damageCalculation.minDamage
    );

    baseDamage = Math.round(baseDamage);
    defender.hp -= baseDamage;

    console.log(gameConfig["battle-messages"].attackMessage
        .replace("{attacker}", attacker.name)
        .replace("{defender}", defender.name)
        .replace("{damage}", baseDamage)
    );
}

function removeDefeatedCards() {
    let removedPlayerCard = false;
    let removedEnemyCard = false;

    if (currentPlayerBattleCards?.char?.hp <= 0) {
        console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentPlayerBattleCards.char.name));
        currentPlayerBattleCards.char = null;
        removedPlayerCard = true;
    }

    if (currentEnemyBattleCards?.char?.hp <= 0) {
        console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentEnemyBattleCards.char.name));
        currentEnemyBattleCards.char = null;
        removedEnemyCard = true;
    }

    if (removedPlayerCard && playerHand.length > 0) {
        currentPlayerBattleCards.char = playerHand.shift();
        console.log(`🔹 New player card selected: ${currentPlayerBattleCards.char.name}`);
    }

    if (removedEnemyCard && enemyHand.length > 0) {
        currentEnemyBattleCards.char = enemyHand.shift();
        console.log(`🔹 New enemy card selected: ${currentEnemyBattleCards.char.name}`);
    }

    updateBattleZones();
}

function updateBattleZones() {
    const playerCharZone = document.getElementById("player-char-zone");
    const enemyCharZone = document.getElementById("enemy-char-zone");

    if (!playerCharZone || !enemyCharZone) {
        console.error("❌ ERROR: Battle zones not found in the DOM!");
        return;
    }

    playerCharZone.innerHTML = "";
    enemyCharZone.innerHTML = "";

    if (currentPlayerBattleCards?.char) {
        playerCharZone.appendChild(createCardElement(currentPlayerBattleCards.char, "char"));
    }

    if (currentEnemyBattleCards?.char) {
        enemyCharZone.appendChild(createCardElement(currentEnemyBattleCards.char, "char"));
    }
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
