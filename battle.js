import { 
    currentPlayerBattleCards, 
    currentEnemyBattleCards, 
    updatePlayerBattleCard, 
    updateEnemyBattleCard, 
    playerHand, 
    enemyHand 
} from "./cards.js";
import { battleSystem, gameConfig } from "./config.js";


function battleRound() {
    if (!currentPlayerBattleCards.length || !currentEnemyBattleCards.length) {
        console.log("❌ No active cards in the battle zone! Waiting for selections...");
        console.log("Debug: currentPlayerBattleCards ->", currentPlayerBattleCards);
        console.log("Debug: currentEnemyBattleCards ->", currentEnemyBattleCards);
        return;
    }

    console.log(gameConfig["battle-messages"].battleStart
        .replace("{player}", currentPlayerBattleCards.map(card => card?.name || "???").join(", "))
        .replace("{enemy}", currentEnemyBattleCards.map(card => card?.name || "???").join(", "))
    );

    currentPlayerBattleCards.forEach(playerCard => {
        currentEnemyBattleCards.forEach(enemyCard => {
            if (playerCard && enemyCard) {
                calculateDamage(playerCard, enemyCard);
            } else {
                console.error("❌ ERROR: One of the battle cards is undefined!", { playerCard, enemyCard });
            }
        });
    });

    removeDefeatedCards();
}

function calculateDamage(attacker, defender) {
    if (!attacker || !defender || !attacker.name || !defender.name) {
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
    let removedPlayerCards = [];
    let removedEnemyCards = [];

    currentPlayerBattleCards.forEach(card => {
        if (card.hp <= 0) {
            console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", card.name));
            removedPlayerCards.push(card);
        }
    });

    currentEnemyBattleCards.forEach(card => {
        if (card.hp <= 0) {
            console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", card.name));
            removedEnemyCards.push(card);
        }
    });

    // Remove defeated cards from battle zones
    currentPlayerBattleCards = currentPlayerBattleCards.filter(card => !removedPlayerCards.includes(card));
    currentEnemyBattleCards = currentEnemyBattleCards.filter(card => !removedEnemyCards.includes(card));

    // Add new cards if available in hand
    if (removedPlayerCards.length && playerHand.length) {
        let newPlayerCards = playerHand.splice(0, removedPlayerCards.length);
        currentPlayerBattleCards.push(...newPlayerCards);
        console.log(`🔹 New player card(s) selected: ${newPlayerCards.map(c => c.name).join(", ")}`);
    }

    if (removedEnemyCards.length && enemyHand.length) {
        let newEnemyCards = enemyHand.splice(0, removedEnemyCards.length);
        currentEnemyBattleCards.push(...newEnemyCards);
        console.log(`🔹 New enemy card(s) selected: ${newEnemyCards.map(c => c.name).join(", ")}`);
    }

    updateBattleZones();
}

function updateBattleZones() {
    document.getElementById("player-char-zone").innerHTML = "";
    document.getElementById("enemy-char-zone").innerHTML = "";

    currentPlayerBattleCards.forEach(card => {
        if (card) document.getElementById("player-char-zone").appendChild(createCardElement(card, "char"));
    });

    currentEnemyBattleCards.forEach(card => {
        if (card) document.getElementById("enemy-char-zone").appendChild(createCardElement(card, "char"));
    });
}

// Attach event listener to play-turn button
document.getElementById("play-turn").addEventListener("click", battleRound);

export { battleRound };


