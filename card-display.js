// card-display.js

import { createCardElement, determineCardType } from "./cards.js";
import { 
    playerHand, enemyHand, 
    currentPlayerBattleCards, currentEnemyBattleCards, enemyDeck, playerDeck 
} from "./config.js";
import { 
    setEnemyHasPlacedCard, placeCardInBattleZone, setPlayerHasPlacedCard, updateEnemyBattleCard 
} from "./update.js";
import { logToResults } from "./ui-display.js"; 
import { logDebug } from "./utils/logger.js";

export function removeDefeatedCards() {
    let playerCardsDefeated = false;
    let enemyCardsDefeated = false;

    const logMessages = [];

    Object.entries(currentPlayerBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logMessages.push(`☠️ ${card.name} has been defeated!`);
            const playerZone = document.getElementById(`player-${type}-zone`);
            if (playerZone) playerZone.innerHTML = "";
            setPlayerHasPlacedCard(false);
            playerCardsDefeated = true;
        }
    });

    Object.entries(currentEnemyBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logMessages.push(`☠️ ${card.name} has been defeated!`);
            const enemyZone = document.getElementById(`enemy-${type}-zone`);
            if (enemyZone) enemyZone.innerHTML = "";
            setEnemyHasPlacedCard(false);
            enemyCardsDefeated = true;
        }
    });

    if (playerCardsDefeated || enemyCardsDefeated) {
        logMessages.push("Resetting battle zones for the next turn.");
    }

    logMessages.forEach(message => logToResults(message));
}

export function updateBattleZones() {
    let hasUpdated = false;
    ["char", "essence", "ability"].forEach(type => {
        const playerZone = document.getElementById(`player-${type}-zone`);
        const enemyZone = document.getElementById(`enemy-${type}-zone`);

        if (playerZone) {
            playerZone.innerHTML = "";
            if (currentPlayerBattleCards[type]) {
                playerZone.appendChild(createCardElement(currentPlayerBattleCards[type], type));
                hasUpdated = true;
            }
        }

        if (enemyZone) {
            enemyZone.innerHTML = "";
            if (currentEnemyBattleCards[type]) {
                enemyZone.appendChild(createCardElement(currentEnemyBattleCards[type], type));
                hasUpdated = true;
            }
        }
    });
}

export function updateHands() {
    logDebug("Updating hands...");
    updateHand("player-hand", playerHand);
    updateHand("enemy-hand", enemyHand);
}

function updateHand(containerId, hand, deck) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    hand.slice(0, 5).forEach(card => { // Limit to 5 cards
        container.appendChild(createCardElement(card));
    });

    // Update the deck count
    const deckCountElement = document.getElementById(`${containerId}-deck-count`);
    if (deckCountElement) {
        deckCountElement.textContent = hand.length; // Ensure this updates correctly
    } else {
        console.warn(`⚠️ Deck count element not found for ${containerId}.`);
    }
}

export function enemyPlaceCard() {
    if (!enemyDeck.length) {
        console.warn("⚠️ Enemy has no more cards available.");
        return;
    }

    const openSlots = getEnemyOpenSlots();
    if (openSlots.length === 0) {
        console.log("🤖 Enemy battle zone is full. No card needed.");
        return;
    }

    const availableCards = enemyDeck.filter(card => openSlots.includes(determineCardType(card)));
    if (availableCards.length === 0) {
        console.warn("⚠️ No suitable cards found for available enemy slots.");
        return;
    }

    const card = availableCards[Math.floor(Math.random() * availableCards.length)];
    const slot = determineCardType(card);

    placeCardInBattleZone(card, `enemy-${slot}-zone`, updateEnemyBattleCard, "Enemy");
    console.log(`🤖 Enemy placed ${card.name} in the ${slot} slot.`);
}
