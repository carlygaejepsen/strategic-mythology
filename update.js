// update.js - Handles battle state updates, placements, and turn resets.

import {
  gameState,
  currentPlayerBattleCards,
  currentEnemyBattleCards,
  playerHand,
  enemyHand,
  playerDeck,
  enemyDeck,
  debugMode
} from "./config.js";
import { onGameStateChange, onEnemyStateChange, updateInstructionText, logToResults } from "./ui-display.js";
import { determineCardType, createCardElement } from "./cards.js";
import {
  selectedAttacker, selectedDefender, selectedCombo,
  setSelectedAttacker, setSelectedDefender, setSelectedCombo
} from "./interact.js";
import { logDebug, logError, logWarn } from "./utils/logger.js";

// We'll rely on debugMode from config
const validCardTypes = ["char", "essence", "ability"];

export function getEnemyOpenSlots() {
  const openSlots = [];

  if (!currentEnemyBattleCards["char"]) openSlots.push("char");
  if (!currentEnemyBattleCards["essence"]) openSlots.push("essence");
  if (!currentEnemyBattleCards["ability"]) openSlots.push("ability");

  return openSlots;
}

// 🃏 Place a Card in the Battle Zone
export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
  if (!card) {
    logError("🚨 ERROR: Card is null or undefined!");
    return null;
  }
  if (debugMode) {
    logDebug(`DEBUG: Attempting to place ${card.name} in ${battleZoneId}`);
  }
  const battleZone = document.getElementById(battleZoneId);
  if (!battleZone) {
    logError(`🚨 ERROR: Battle zone '${battleZoneId}' not found!`);
    return;
  }

  const existingCardElement = battleZone.querySelector(`[data-card-id="${card.id}"]`);
  if (existingCardElement) {
    logWarn(`⚠️ WARNING: Card with ID '${card.id}' already exists in the battle zone.`);
    return existingCardElement;
  }

  const type = determineCardType(card);
  if (type === "unknown" || !validCardTypes.includes(type)) {
    logError(`🚨 ERROR: Invalid card type '${type}' for ${card.name}!`);
    return null;
  }

  const cardElement = createCardElement(card, type);
  battleZone.appendChild(cardElement);
  updateFunction(card, type);

  if (owner === "Player") {
    currentPlayerBattleCards[type] = card;
  } else if (owner === "Enemy") {
    currentEnemyBattleCards[type] = card;
  } else {
    logError(`🚨 ERROR: Invalid owner '${owner}'!`);
    return null;
  }

  if (debugMode) {
    logDebug(`🔄 ${owner} placed a ${type} card: ${card.name}`);
  }
  return cardElement;
}

// ✅ Properly resets selections at the end of a turn
export function resetSelections() {
  if (debugMode) {
    logDebug("🔄 Resetting selections...");
  }
  setSelectedAttacker(null);
  setSelectedDefender(null);
  setSelectedCombo(null);
  gameState.playerHasPlacedCard = false;
  gameState.enemyHasPlacedCard = false;
  updateInstructionText("select-battle-card");
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
  if (gameState.playerHasPlacedCard && gameState.enemyHasPlacedCard) {
    onGameStateChange("select-attacker");
  }
  onEnemyStateChange("enemy-select-attacker");
}

// ✅ Updates player's battle card in game state
export function updatePlayerBattleCard(card, type) {
  currentPlayerBattleCards[type] = card;
  if (debugMode) {
    logDebug(`🔄 Player's ${type} card updated: ${card.name}`);
  }
}

// ✅ Updates enemy's battle card in game state
export function updateEnemyBattleCard(card, type) {
  if (!validCardTypes.includes(type)) {
    logError(`🚨 ERROR: Invalid card type '${type}' for ${card.name}!`);
    return;
  }
  currentEnemyBattleCards[type] = card;
  if (debugMode) {
    logDebug(`🔄 Enemy's ${type} card updated: ${card.name}`);
  }
}

/**
 * Draws cards for the player until their hand is full (5 cards).
 * If the player's deck is empty, no more cards can be drawn.
 */
export function drawCardsForPlayer() {
  const cardsToDraw = Math.min(5 - playerHand.length, playerDeck.length);
  for (let i = 0; i < cardsToDraw; i++) {
    const playerDrawnCard = playerDeck.shift();
    if (playerDrawnCard) {
      playerHand.push(playerDrawnCard);
      logToResults(`🃏 Player draws ${playerDrawnCard.name}`);
    } else {
      logWarn("⚠️ Player deck is empty, cannot draw more cards.");
    }
  }
}

/**
 * Draws cards for the enemy until their hand is full (5 cards).
 * If the enemy's deck is empty, no more cards can be drawn.
 */
export function drawCardsForEnemy() {
  const cardsToDraw = Math.min(5 - enemyHand.length, enemyDeck.length);
  for (let i = 0; i < cardsToDraw; i++) {
    const enemyDrawnCard = enemyDeck.shift();
    if (enemyDrawnCard) {
      enemyHand.push(enemyDrawnCard);
      logToResults(`🃏 Enemy draws ${enemyDrawnCard.name}`);
    } else {
      logWarn("⚠️ Enemy deck is empty, cannot draw more cards.");
    }
  }
}

// 🤖 **Enemy AI Places a Card**
export function enemyPlaceCard() {
  return new Promise((resolve) => {
    const openSlots = getEnemyOpenSlots();
    if (openSlots.length === 0) {
      logDebug("🤖 Enemy battle zone is full.");
      resolve(false);
      return;
    }

    // Try to draw if hand is empty
    if (enemyHand.length === 0) {
      drawCardsForEnemy();
      updateHands();
    }

    const card = enemyHand.shift();
    if (!card) {
      logWarn("⚠️ Enemy has no cards to place.");
      resolve(false);
      return;
    }

    const slot = openSlots[Math.floor(Math.random() * openSlots.length)];
    placeCardInBattleZone(card, `enemy-${slot}-zone`, updateEnemyBattleCard, "Enemy");
    setEnemyHasPlacedCard(true);
    updateHands();
    resolve(true);
  });
}
