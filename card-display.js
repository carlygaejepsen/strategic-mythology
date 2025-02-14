// card-display.js

import { createCardElement } from "./cards.js";
import { determineCardType } from "./cards.js";
import { 
    playerHand, enemyHand, cardTemplates, gameConfig, 
    currentPlayerBattleCards, currentEnemyBattleCards, gameState 
} from "./config.js";
import { 
    setEnemyHasPlacedCard, placeCardInBattleZone, setPlayerHasPlacedCard 
} from "./update.js";
import { logToResults } from "./ui-display.js"; // Imported for logging battle events
// Removes only defeated cards without affecting the rest of the battle zone
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
        // Optionally, trigger a UI update for the next turn
        logToResults("Resetting battle zones for the next turn.");
    }
}
// Rebuilds the battle zones for both player and enemy
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
// Updates both player's and enemy's hand displays
export function updateHands() {
    updateHand("player-hand", playerHand);
    updateHand("enemy-hand", enemyHand);
}
// Update Hand 2.0
function updateHand(containerId, hand) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`❌ ERROR: Container '${containerId}' not found.`);
    return;
  }

  // Create a set of existing card IDs in the container
  const existingCardIds = new Set(
    Array.from(container.children).map(child => child.getAttribute("data-card-id"))
  );

  hand.forEach(card => {
    if (!existingCardIds.has(card.id)) {
      container.appendChild(createCardElement(card, determineCardType(card)));
    }
  });
}
// Helper: Returns a random card from the provided battle zone object
export function getRandomCardFromZone(battleZone) {
    const availableCards = Object.values(battleZone).filter(card => card !== null);
    return availableCards.length > 0
        ? availableCards[Math.floor(Math.random() * availableCards.length)]
        : null;
}
// Triggers enemy AI to place a card in the battle zone
export function enemyPlaceCard() {
    if (!gameState.enemyHasPlacedCard && enemyHand.length > 0) {
        const enemyCard = enemyHand.shift();
        const type = determineCardType(enemyCard);

        // Allow "ability" or "essence" cards even if one already exists
        if (type === "ability" || type === "essence" || !currentEnemyBattleCards[type]) {
            placeCardInBattleZone(enemyCard, `enemy-${type}-zone`, updateEnemyBattleCard, "Enemy");
            console.log(`🤖 Enemy placed ${enemyCard.name} in battle.`);
            setEnemyHasPlacedCard(true);
        }
    }
}
// Updates the HP of a card in the battle zone without re-drawing the entire card
export function updateCardHP(card) {
    if (!card || !card.id) return;

    // Find the card element using its data attribute
    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
    if (!cardElement) {
        console.warn(`⚠️ Could not find card element for ${card.name} to update HP.`);
        return;
    }

    // Update the element displaying the card's HP
    const hpElement = cardElement.querySelector(".card-hp");
    if (hpElement) {
        hpElement.textContent = card.hp;
    } else {
        console.warn(`⚠️ No HP element found for ${card.name}.`);
    }
}
