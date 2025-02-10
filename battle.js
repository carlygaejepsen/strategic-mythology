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
        console.log("Debug: currentPlayerBattleCards ->", currentPlayerBattleCards);
        console.log("Debug: currentEnemyBattleCards ->", currentEnemyBattleCards);
        return;
    }

    logToResults(`⚔️ ${currentPlayerBattleCards.char.name} vs ${currentEnemyBattleCards.char.name} begins!`);

    // 💥 Character vs Character Combat
    processCombat(currentPlayerBattleCards.char, currentEnemyBattleCards.char);

    // 🔥 Essence Card Effects (if both players have one)
    if (currentPlayerBattleCards.essence && currentEnemyBattleCards.essence) {
        processCombat(currentPlayerBattleCards.essence, currentEnemyBattleCards.essence);
    }

    // 🔥 Player’s Essence & Ability Affecting the Enemy Character
    if (currentPlayerBattleCards.essence) {
        processCombat(currentPlayerBattleCards.essence, currentEnemyBattleCards.char);
    }
    if (currentPlayerBattleCards.ability) {
        processCombat(currentPlayerBattleCards.ability, currentEnemyBattleCards.char);
    }

    // 🔥 Enemy’s Essence & Ability Affecting the Player Character
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

    // 🌟 Log what’s happening to verify the order of attacks
    logToResults(`${attacker.name} attacks ${defender.name}!`);

    // ✅ Essence & Ability Cards Might Not Have ATK
    let attackPower = attacker.atk ?? 0;
    if (attackPower === 0) {
        logToResults(`⚠️ ${attacker.name} has no attack power and does no damage.`);
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
        (attackPower * essenceMultiplier * classMultiplier) - (defender.def ?? 0),
        battleSystem.damageCalculation.minDamage
    );

    baseDamage = Math.round(baseDamage);
    defender.hp -= baseDamage;

    logToResults(`${attacker.name} deals ${baseDamage} damage to ${defender.name}!`);
}

function removeDefeatedCards() {
    let removedPlayerCard = false;
    let removedEnemyCard = false;

    // ⚔️ Remove Character if Defeated
    if (currentPlayerBattleCards.char?.hp <= 0) {
        logToResults(`☠️ ${currentPlayerBattleCards.char.name} has been defeated!`);
        currentPlayerBattleCards.char = null;
        removedPlayerCard = true;
    }
    if (currentEnemyBattleCards.char?.hp <= 0) {
        logToResults(`☠️ ${currentEnemyBattleCards.char.name} has been defeated!`);
        currentEnemyBattleCards.char = null;
        removedEnemyCard = true;
    }

    // 🌟 Remove Essence & Ability If Defeated
    if (currentPlayerBattleCards.essence?.hp <= 0) {
        logToResults(`☠️ ${currentPlayerBattleCards.essence.name} has been exhausted!`);
        currentPlayerBattleCards.essence = null;
    }
    if (currentPlayerBattleCards.ability?.hp <= 0) {
        logToResults(`☠️ ${currentPlayerBattleCards.ability.name} has been used up!`);
        currentPlayerBattleCards.ability = null;
    }
    if (currentEnemyBattleCards.essence?.hp <= 0) {
        logToResults(`☠️ ${currentEnemyBattleCards.essence.name} has been exhausted!`);
        currentEnemyBattleCards.essence = null;
    }
    if (currentEnemyBattleCards.ability?.hp <= 0) {
        logToResults(`☠️ ${currentEnemyBattleCards.ability.name} has been used up!`);
        currentEnemyBattleCards.ability = null;
    }

    // 🃏 Draw new character cards if available
    if (removedPlayerCard && playerHand.length > 0) {
        currentPlayerBattleCards.char = playerHand.shift();
        logToResults(`🔄 Player draws ${currentPlayerBattleCards.char.name} into battle!`);
    }
    if (removedEnemyCard && enemyHand.length > 0) {
        currentEnemyBattleCards.char = enemyHand.shift();
        logToResults(`🔄 Enemy draws ${currentEnemyBattleCards.char.name} into battle!`);
    }

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
