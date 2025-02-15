// update.js - Handles battle state updates, placements, and turn resets.

import { 
  gameState, 
  currentPlayerBattleCards, 
  currentEnemyBattleCards 
} from "./config.js";
import { onGameStateChange, onEnemyStateChange, updateInstructionText } from "./ui-display.js";
import { determineCardType, createCardElement } from "./cards.js";
import { 
  selectedAttacker, selectedDefender, selectedCombo, 
  setSelectedAttacker, setSelectedDefender, setSelectedCombo 
} from "./interact.js"; 

// 🃏 Place a Card in the Battle Zone
export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
  console.log(`DEBUG: Attempting to place ${card.name} in ${battleZoneId}`);
  const battleZone = document.getElementById(battleZoneId);
  if (!battleZone) return;
  
  battleZone.innerHTML = "";
  const type = determineCardType(card);
  if (!["char", "essence", "ability"].includes(type)) {
    console.error(`🚨 ERROR: Invalid card type '${type}' for ${card.name}!`);
    return;
  }
  const cardElement = createCardElement(card, type);
  battleZone.appendChild(cardElement);
  updateFunction(card, type);
  
  if (owner === "Player") {
    currentPlayerBattleCards[type] = card;
  } else {
    currentEnemyBattleCards[type] = card;
  }
  console.log(`🔄 ${owner} placed a ${type} card: ${card.name}`);
  return cardElement;
}

// ✅ Properly resets selections at the end of a turn
export function resetTurnSelections() {
  console.log("🔄 Resetting selections...");
  setSelectedAttacker(null);
  setSelectedDefender(null);
  setSelectedCombo(null);
  updateInstructionText("select-card"); // Ensure UI updates correctly
}

// ✅ Resets selections and game state flags for a new turn.
export function resetSelections() {
  resetTurnSelections();
  setPlayerHasPlacedCard(false);
  setEnemyHasPlacedCard(false);
  console.log("🔄 Reset selections and game state flags for new turn.");
}

// ✅ Updates whether the player has placed a card.
export function setPlayerHasPlacedCard(value) {
  gameState.playerHasPlacedCard = value;
  if (gameState.playerHasPlacedCard && gameState.enemyHasPlacedCard) {
    onGameStateChange("select-attacker");
  }
}

// ✅ Updates whether the enemy has placed a card.
export function setEnemyHasPlacedCard(value) {
  gameState.enemyHasPlacedCard = value;
  if (typeof onEnemyStateChange === "function") {
    onEnemyStateChange("enemy-select-attacker");
  } else {
    console.error("🚨 ERROR: onEnemyStateChange is not defined!");
  }
}

// ✅ Updates player's battle card in game state
export function updatePlayerBattleCard(card, type) {
  currentPlayerBattleCards[type] = card || null;
}

// ✅ Updates enemy's battle card in game state
export function updateEnemyBattleCard(card, type) {
  currentEnemyBattleCards[type] = card || null;
}
export function drawCardsToFillHands() {
    console.log("DEBUG: Drawing cards - Player Hand:", playerHand, "Enemy Hand:", enemyHand);

    if (playerHand.length < 6 && playerDeck.length > 0) {
        const drawnCard = playerDeck.shift();
        playerHand.push(drawnCard);
        logToResults(`🃏 Player draws ${drawnCard.name}`);

        // Only add the new card to the display (DO NOT clear and re-add everything)
        const playerHandElement = document.getElementById("player-hand");
        if (playerHandElement) {
            playerHandElement.appendChild(createCardElement(drawnCard, determineCardType(drawnCard)));
        }
    }

    if (enemyHand.length < 6 && enemyDeck.length > 0) {
        const drawnCard = enemyDeck.shift();
        enemyHand.push(drawnCard);
        logToResults(`🃏 Enemy draws ${drawnCard.name}`);

        // Only add the new card to the display (DO NOT clear and re-add everything)
        const enemyHandElement = document.getElementById("enemy-hand");
        if (enemyHandElement) {
            enemyHandElement.appendChild(createCardElement(drawnCard, determineCardType(drawnCard)));
        }
    }
}
