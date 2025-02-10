// display.js - Handles all rendering and UI updates

import { 
    currentPlayerBattleCards, 
    currentEnemyBattleCards, 
    playerHand, 
    enemyHand, 
    createCardElement, 
    determineCardType 
} from "./cards.js";

import { gameConfig } from "./config.js";

// ✅ Update results log
export function logToResults(message) {
    const logElement = document.getElementById("results-log");
    if (!logElement) return;
    
    const entry = document.createElement("p");
    entry.textContent = message;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight; // Auto-scroll
}

// ✅ Place card into battle zone
export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
    const battleZone = document.getElementById(battleZoneId);
    if (!battleZone) return;

    battleZone.innerHTML = ""; // ✅ Replace only that type of card
    const cardElement = createCardElement(card, determineCardType(card));
    battleZone.appendChild(cardElement);

    updateFunction(card, determineCardType(card));
    console.log(`🔄 ${owner} ${determineCardType(card)} battle card updated: ${card.name}`);

    return cardElement;
}

// ✅ Remove defeated cards & update UI
export function removeDefeatedCards() {
    let removedPlayerCard = false;
    let removedEnemyCard = false;

    // ⚔️ Remove defeated Character cards
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

    // 🌟 Remove Essence & Ability if defeated
    ["essence", "ability"].forEach(type => {
        if (currentPlayerBattleCards[type]?.hp <= 0) {
            logToResults(`☠️ ${currentPlayerBattleCards[type].name} has been exhausted!`);
            currentPlayerBattleCards[type] = null;
        }
        if (currentEnemyBattleCards[type]?.hp <= 0) {
            logToResults(`☠️ ${currentEnemyBattleCards[type].name} has been exhausted!`);
            currentEnemyBattleCards[type] = null;
        }
    });

    updateBattleZones();
}

// ✅ Update battle zones efficiently
export function updateBattleZones() {
    ["char", "essence", "ability"].forEach(type => {
        const playerZone = document.getElementById(`player-${type}-zone`);
        const enemyZone = document.getElementById(`enemy-${type}-zone`);
        
        if (playerZone) {
            playerZone.innerHTML = "";
            if (currentPlayerBattleCards[type]) {
                playerZone.appendChild(createCardElement(currentPlayerBattleCards[type], type));
            }
        }
        
        if (enemyZone) {
            enemyZone.innerHTML = "";
            if (currentEnemyBattleCards[type]) {
                enemyZone.appendChild(createCardElement(currentEnemyBattleCards[type], type));
            }
        }
    });
    console.log("🛠️ Battle zones updated.");
}

// ✅ Remove played cards from hands when placed in battle
export function removeCardFromHand(card, handArray, handId) {
    const index = handArray.indexOf(card);
    if (index !== -1) {
        handArray.splice(index, 1);
    }
    updateHand(handId, handArray);
}

// ✅ Update player and enemy hands
export function updateHands() {
    updateHand("player-hand", playerHand);
    updateHand("enemy-hand", enemyHand);
}

function updateHand(handId, handArray) {
    const handElement = document.getElementById(handId);
    if (!handElement) return;
    
    handElement.innerHTML = "";
    handArray.forEach(card => {
        const cardElement = createCardElement(card, "char");
        cardElement.addEventListener("click", () => {
            console.log(`🖱️ Clicked on card: ${card.name}`);
        });
        handElement.appendChild(cardElement);
    });
}


