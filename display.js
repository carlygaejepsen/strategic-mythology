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

/**
 * Logs a message to the results log (the UI area),
 * scrolls to bottom so latest message is visible.
 */
export function logToResults(message) {
    const logElement = document.getElementById("results-log");
    if (!logElement) return;
    
    const entry = document.createElement("p");
    entry.textContent = message;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight; // Auto-scroll
}

/**
 * Places a card in the specified battle zone, clearing previous
 * card of the same type if needed, then calls updateFunction
 * (e.g. updatePlayerBattleCard) to record that card as active.
 */
export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
    const battleZone = document.getElementById(battleZoneId);
    if (!battleZone) return;

    // Clear out old card of that type before adding this one
    battleZone.innerHTML = "";
    const cardElement = createCardElement(card, determineCardType(card));
    battleZone.appendChild(cardElement);

    updateFunction(card, determineCardType(card));
    console.log(`🔄 ${owner} ${determineCardType(card)} battle card updated: ${card.name}`);

    return cardElement;
}

/**
 * Removes any defeated cards from currentPlayerBattleCards/currentEnemyBattleCards,
 * logs the defeat, and updates the battle zones.
 */
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

    // 🌟 Remove Essence & Ability if they're at 0 HP
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

    // After removing defeated cards, refresh the battle zones
    updateBattleZones();
}

/**
 * Updates the battle zones for char, essence, and ability,
 * using createCardElement to display active cards.
 */
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

/**
 * Removes a card from a given hand array and updates the UI
 * for that specific hand container (if you use it).
 */
export function removeCardFromHand(card, handArray, handId) {
    const index = handArray.indexOf(card);
    if (index !== -1) {
        handArray.splice(index, 1);
    }
    updateHand(handId, handArray);
}

/**
 * Calls updateHand() for the player's hand and the enemy's hand.
 */
export function updateHands() {
    updateHand("player-hand", playerHand);
    updateHand("enemy-hand", enemyHand);
}

/**
 * Updates the DOM for a single hand container, clearing it
 * and appending createCardElement() for each card in handArray.
 */
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
