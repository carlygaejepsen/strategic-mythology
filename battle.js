import { currentPlayerBattleCards, currentEnemyBattleCards, playerHand, enemyHand, createCardElement } from "./cards.js";
import { battleSystem, gameConfig } from "./config.js";

function logToResults(message) {
    const resultsLog = document.getElementById("results-log");
    if (!resultsLog) {
        console.error("❌ ERROR: Results log container not found!");
        return;
    }

    // Create new log entry
    const logEntry = document.createElement("p");
    logEntry.textContent = message;

    // Append to results log
    resultsLog.appendChild(logEntry);

    // Keep only the latest 5 entries for readability
    while (resultsLog.children.length > 5) {
        resultsLog.removeChild(resultsLog.firstChild);
    }
}

function setupPlayTurnButton() {
    const playTurnButton = document.getElementById("play-turn");

    if (playTurnButton) {
        // Remove any existing event listeners before adding a new one
        playTurnButton.replaceWith(playTurnButton.cloneNode(true)); 
        const newButton = document.getElementById("play-turn"); 
        newButton.addEventListener("click", battleRound);
    } else {
        console.error("❌ ERROR: 'Play Turn' button not found!");
    }
}

function battleRound() {
    if (!currentPlayerBattleCards?.char || !currentEnemyBattleCards?.char) {
        logToResults("❌ No active cards in the battle zone! Waiting for selections...");
        return;
    }

    logToResults(gameConfig["battle-messages"].battleStart
        .replace("{player}", currentPlayerBattleCards.char.name)
        .replace("{enemy}", currentEnemyBattleCards.char.name)
    );

    // 🏹 Player Attacks Enemy
    processCombat(currentPlayerBattleCards.char, currentEnemyBattleCards.char);

    // 🛡 Enemy gets a turn if they survived
    if (currentEnemyBattleCards.char?.hp > 0) {
        processCombat(currentEnemyBattleCards.char, currentPlayerBattleCards.char);
    } else {
        logToResults(`💀 ${currentEnemyBattleCards.char.name} was defeated before attacking!`);
    }

    // 🛠 Remove defeated cards & update battle zones
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

    const attackMessage = gameConfig["battle-messages"].attackMessage
        .replace("{attacker}", attacker.name)
        .replace("{defender}", defender.name)
        .replace("{damage}", baseDamage);

    logToResults(attackMessage);
}

function removeDefeatedCards() {
    let removedPlayerCard = false;
    let removedEnemyCard = false;

    // ✅ Remove defeated Character cards
    if (currentPlayerBattleCards?.char?.hp <= 0) {
        logToResults(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentPlayerBattleCards.char.name));
        currentPlayerBattleCards.char = null;
        removedPlayerCard = true;
    }

    if (currentEnemyBattleCards?.char?.hp <= 0) {
        logToResults(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentEnemyBattleCards.char.name));
        currentEnemyBattleCards.char = null;
        removedEnemyCard = true;
    }

    // ✅ Remove defeated Essence cards (if used)
    if (currentPlayerBattleCards?.essence?.hp <= 0) {
        logToResults(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentPlayerBattleCards.essence.name));
        currentPlayerBattleCards.essence = null;
    }

    if (currentEnemyBattleCards?.essence?.hp <= 0) {
        logToResults(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentEnemyBattleCards.essence.name));
        currentEnemyBattleCards.essence = null;
    }

    // ✅ Remove defeated Ability cards (if used)
    if (currentPlayerBattleCards?.ability?.hp <= 0) {
        logToResults(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentPlayerBattleCards.ability.name));
        currentPlayerBattleCards.ability = null;
    }

    if (currentEnemyBattleCards?.ability?.hp <= 0) {
        logToResults(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentEnemyBattleCards.ability.name));
        currentEnemyBattleCards.ability = null;
    }

    // ✅ Replace Player's defeated card with next available card
    if (removedPlayerCard && playerHand.length > 0) {
        currentPlayerBattleCards.char = playerHand.shift();
        logToResults(`🔹 New player card selected: ${currentPlayerBattleCards.char.name}`);
    } else if (removedPlayerCard) {
        logToResults("⚠️ Player has no more cards left!");
    }

    // ✅ Replace Enemy's defeated card with next available card
    if (removedEnemyCard && enemyHand.length > 0) {
        currentEnemyBattleCards.char = enemyHand.shift();
        logToResults(`🔹 New enemy card selected: ${currentEnemyBattleCards.char.name}`);
    } else if (removedEnemyCard) {
        logToResults("⚠️ Enemy has no more cards left!");
    }

    // ✅ Update UI to reflect changes
    updateBattleZones();
}

function updateBattleZones() {
    // 🔹 Select battle zones
    const playerCharZone = document.getElementById("player-char-zone");
    const playerEssenceZone = document.getElementById("player-essence-zone");
    const playerAbilityZone = document.getElementById("player-ability-zone");

    const enemyCharZone = document.getElementById("enemy-char-zone");
    const enemyEssenceZone = document.getElementById("enemy-essence-zone");
    const enemyAbilityZone = document.getElementById("enemy-ability-zone");

    // 🔥 Clear battle zones before updating (removes defeated cards)
    playerCharZone.innerHTML = "";
    playerEssenceZone.innerHTML = "";
    playerAbilityZone.innerHTML = "";

    enemyCharZone.innerHTML = "";
    enemyEssenceZone.innerHTML = "";
    enemyAbilityZone.innerHTML = "";

    // ✅ Update Character Cards
    if (currentPlayerBattleCards.char) {
        playerCharZone.appendChild(createCardElement(currentPlayerBattleCards.char, "char"));
    }
    if (currentEnemyBattleCards.char) {
        enemyCharZone.appendChild(createCardElement(currentEnemyBattleCards.char, "char"));
    }

    // ✅ Update Essence Cards (if applicable)
    if (currentPlayerBattleCards.essence) {
        playerEssenceZone.appendChild(createCardElement(currentPlayerBattleCards.essence, "essence"));
    }
    if (currentEnemyBattleCards.essence) {
        enemyEssenceZone.appendChild(createCardElement(currentEnemyBattleCards.essence, "essence"));
    }

    // ✅ Update Ability Cards (if applicable)
    if (currentPlayerBattleCards.ability) {
        playerAbilityZone.appendChild(createCardElement(currentPlayerBattleCards.ability, "ability"));
    }
    if (currentEnemyBattleCards.ability) {
        enemyAbilityZone.appendChild(createCardElement(currentEnemyBattleCards.ability, "ability"));
    }

    logToResults("🛠️ Battle zones updated.");
}

document.addEventListener("DOMContentLoaded", setupPlayTurnButton);

export { battleRound };
