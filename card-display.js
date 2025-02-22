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
import { getEnemyOpenSlots} from "./battle.js";

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
    updateHand("player-hand", playerHand, playerDeck);
    updateHand("enemy-hand", enemyHand, enemyDeck);
}

function updateHand(containerId, hand, deck) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`⚠️ Container element not found for ${containerId}.`);
        return;
    }

    // Find the existing deck element (DO NOT CREATE IT)
    let deckElement = document.getElementById(`${containerId}-deck`);
    let deckCountElement = document.getElementById(`${containerId}-deck-count`);

    // Remove all existing card elements in the hand (EXCEPT the deck card)
    Array.from(container.children)
        .filter(el => el.classList.contains("card-container") && el.id !== `${containerId}-deck`)
        .forEach(el => el.remove());

    // Add missing cards (up to 5)
    hand.slice(0, 5).forEach(card => {
        const cardElement = createCardElement(card);
        if (cardElement) {
            cardElement.dataset.cardId = card.id;
            container.appendChild(cardElement);
        } else {
            console.warn(`⚠️ Failed to create card element for ${card.name}.`);
        }
    });
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

export function updateCardHP(card) {
    if (!card || !card.id || typeof card.hp !== 'number') return;

    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
    if (!cardElement) {
        console.warn(`⚠️ Could not find card element for ${card.name} to update HP.`);
        return;
    }

    const hpElement = cardElement.querySelector(".card-hp");
    if (hpElement) {
        hpElement.textContent = card.hp;
    } else {
        console.warn(`⚠️ No HP element found for ${card.name}.`);
    }
}

export function getRandomCardFromZone(zone) {
    const cards = Object.values(zone).filter(card => card);
    if (cards.length === 0) return null;
    return cards[Math.floor(Math.random() * cards.length)];
}

export function discardToDeck(hand, deck) {
    const selectedCards = []; // Assume this array gets populated with user-selected cards to discard

    selectedCards.forEach(card => {
        const cardIndex = hand.indexOf(card);
        if (cardIndex > -1) {
            hand.splice(cardIndex, 1);
            deck.push(card);
        }
    });

    shuffleDeck(deck); // Shuffle the deck after discarding
    updateHands(); // Update the hands to reflect the changes
}
