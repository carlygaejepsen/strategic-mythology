// card-display.js

import { createCardElement } from "./cards.js";
import { determineCardType } from "./cards.js";
import { 
    playerHand, enemyHand, cardTemplates, gameConfig, 
    currentPlayerBattleCards, currentEnemyBattleCards, gameState 
} from "./config.js";
import { 
    setEnemyHasPlacedCard, placeCardInBattleZone, setPlayerHasPlacedCard, updateEnemyBattleCard 
} from "./update.js";
import { logToResults } from "./ui-display.js"; 
import { logDebug, logError, logWarn } from "./utils/logger.js";

export function removeDefeatedCards() {
    let playerCardsDefeated = false;
    let enemyCardsDefeated = false;

    Object.entries(currentPlayerBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logToResults(`☠️ ${card.name} has been defeated!`);
            delete currentPlayerBattleCards[type];
            const playerZone = document.getElementById(`player-${type}-zone`);
            if (playerZone) playerZone.innerHTML = "";
            setPlayerHasPlacedCard(false);
            playerCardsDefeated = true;
        }
    });

    Object.entries(currentEnemyBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logToResults(`☠️ ${card.name} has been defeated!`);
            delete currentEnemyBattleCards[type];
            const enemyZone = document.getElementById(`enemy-${type}-zone`);
            if (enemyZone) enemyZone.innerHTML = "";
            setEnemyHasPlacedCard(false);
            enemyCardsDefeated = true;
        }
    });

    if (playerCardsDefeated || enemyCardsDefeated) {
        logToResults("Resetting battle zones for the next turn.");
    }
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

function updateHand(containerId, hand) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ ERROR: Container '${containerId}' not found. Ensure the DOM has fully loaded before updating hands.`);
        return;
    }

    const existingCards = new Set([...container.children].map(el => el.getAttribute("data-card-id")));
    const currentCardIds = new Set(hand.map(card => card.id));

    existingCards.forEach(cardId => {
        if (!currentCardIds.has(cardId)) {
            const cardElement = container.querySelector(`[data-card-id='${cardId}']`);
            if (cardElement) container.removeChild(cardElement);
        }
    });

    hand.forEach(card => {
        if (!existingCards.has(card.id)) {
            container.appendChild(createCardElement(card, determineCardType(card)));
        }
    });
}

export function getRandomCardFromZone(battleZone) {
    const availableCards = Object.values(battleZone).filter(card => card !== null);
    return availableCards.length > 0
        ? availableCards[Math.floor(Math.random() * availableCards.length)]
        : null;
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
    if (!card || !card.id) return;

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
