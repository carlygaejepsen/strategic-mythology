// update.js - Handles battle state updates, placements, and turn resets.

import { 
  gameState, 
  currentPlayerBattleCards, 
  currentEnemyBattleCards
} from "./config.js";
import { onGameStateChange, onEnemyStateChange } from "./ui-display.js";
import { determineCardType, createCardElement } from "./cards.js";

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

// Resets turn selections (moved to interact.js)
export function resetTurnSelections() {
  console.log("🔄 Selections reset.");
}

// Resets selections and game state flags for a new turn.
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
