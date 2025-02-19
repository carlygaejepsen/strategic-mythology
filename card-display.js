// card-display.js

import { createCardElement, determineCardType } from "./cards.js";
import { 
    playerHand, enemyHand, 
    currentPlayerBattleCards, currentEnemyBattleCards, enemyDeck 
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

function updateHand(containerId, hand) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    hand.forEach(card => {
        container.appendChild(createCardElement(card));
    });
}

function getEnemyOpenSlots() {
    const openSlots = [];

    if (!currentEnemyBattleCards["char"]) openSlots.push("char");
    if (!currentEnemyBattleCards["essence"]) openSlots.push("essence");
    if (!currentEnemyBattleCards["ability"]) openSlots.push("ability");

    return openSlots;
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
