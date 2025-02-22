// update.js - Handles battle state updates, placements, and turn resets.

import { 
  gameState, 
  currentPlayerBattleCards, 
  currentEnemyBattleCards, 
  playerHand,
  enemyHand, 
  playerDeck, 
  enemyDeck
} from "./config.js";
import { onGameStateChange, onEnemyStateChange, updateInstructionText, logToResults } from "./ui-display.js";
import { determineCardType, createCardElement } from "./cards.js";
import { 
  selectedAttacker, selectedDefender, selectedCombo, 
  setSelectedAttacker, setSelectedDefender, setSelectedCombo
} from "./interact.js"; 
import { logDebug, logError, logWarn } from "./utils/logger.js";

const debugMode = false; // Set to true for debugging, false to reduce logs
const validCardTypes = ["char", "essence", "ability"];

// 🃏 Place a Card in the Battle Zone
/**
 * Places a card in the specified battle zone.
 * @param {Object} card - The card object to be placed.
 * @param {string} battleZoneId - The ID of the battle zone element.
 * @param {Function} updateFunction - The function to call for updating the card state.
 * @param {string} owner - The owner of the card ("Player" or "Enemy").
 * @returns {HTMLElement} The card element that was placed in the battle zone.
 */
export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
  if (!card) {
    logError("🚨 ERROR: Card is null or undefined!");
    return null;
  }
  if (debugMode) logDebug(`DEBUG: Attempting to place ${card.name} in ${battleZoneId}`);
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
  
  if (debugMode) logDebug(`🔄 ${owner} placed a ${type} card: ${card.name}`);
  return cardElement;
}

// ✅ Properly resets selections at the end of a turn
export function resetTurnSelections() {
  if (debugMode) logDebug("🔄 Resetting selections...");
  setSelectedAttacker(null);
  setSelectedDefender(null);
  setSelectedCombo(null);
  updateInstructionText("select-battle-card"); // Ensure UI updates correctly
}

// ✅ Updates whether the player has placed a card.
export function setPlayerHasPlacedCard(value) {
  gameState.playerHasPlacedCard = value;
  if (gameState.playerHasPlacedCard && gameState.enemyHasPlacedCard) {
    if (typeof onGameStateChange === "function") {
      onGameStateChange("select-attacker");
    } else {
      logError("🚨 ERROR: onGameStateChange is not defined!");
    }
  }
}

// ✅ Updates whether the enemy has placed a card.
export function setEnemyHasPlacedCard(value) {
  gameState.enemyHasPlacedCard = value;
  if (gameState.playerHasPlacedCard && gameState.enemyHasPlacedCard) {
    if (typeof onGameStateChange === "function") {
      onGameStateChange("select-attacker");
    } else {
      logError("🚨 ERROR: onGameStateChange is not defined!");
    }
  }
  if (typeof onEnemyStateChange === "function") {
    onEnemyStateChange("enemy-select-attacker");
  } else {
    logError("🚨 ERROR: onEnemyStateChange is not defined!");
  }
}

// ✅ Resets selections and game state flags for a new turn.
export function resetSelections() {
    return new Promise((resolve) => {
        setSelectedAttacker(null);
        setSelectedDefender(null);
        setSelectedCombo(null);
        resolve();
    });
}

// ✅ Updates player's battle card in game state
export function updatePlayerBattleCard(card, type) {
  currentPlayerBattleCards[type] = card;
  if (debugMode) logDebug(`🔄 Player's ${type} card updated: ${card.name}`);
}

// ✅ Updates enemy's battle card in game state
export function updateEnemyBattleCard(card, type) {
  if (!validCardTypes.includes(type)) {
    logError(`🚨 ERROR: Invalid card type '${type}' for ${card.name}!`);
    return;
  }
  currentEnemyBattleCards[type] = card;
  if (debugMode) logDebug(`🔄 Enemy's ${type} card updated: ${card.name}`);
}

// Draw Cards to Fill Hands 2.0
export function drawCardsToFillHands() {
  if (debugMode) {
    logDebug(`DEBUG: Drawing cards - Player Hand: ${JSON.stringify(playerHand)}`);
    logDebug(`DEBUG: Drawing cards - Enemy Hand: ${JSON.stringify(enemyHand)}`);
  }
  drawCardsForPlayer();
  drawCardsForEnemy();
}

/**
 * Draws cards for the player until their hand is full (5 cards).
 * If the player's deck is empty, no more cards can be drawn.
 */
function drawCardsForPlayer() {
  const cardsToDraw = Math.min(5 - playerHand.length, playerDeck.length);
  for (let i = 0; i < cardsToDraw; i++) {
    const playerDrawnCard = playerDeck.shift();
    if (playerDrawnCard) {
      playerHand.push(playerDrawnCard);
      logToResults(`🃏 Player draws ${playerDrawnCard.name}`);

      const playerHandElement = document.getElementById("player-hand");
      if (playerHandElement) {
        playerHandElement.appendChild(createCardElement(playerDrawnCard, determineCardType(playerDrawnCard)));
        if (debugMode) logDebug(`DEBUG: Player hand updated with ${playerDrawnCard.name}`);
      } else {
        logError(`🚨 ERROR: Failed to create card element for ${playerDrawnCard.name}`);
      }
    } else {
      logWarn("⚠️ Player deck is empty, cannot draw more cards.");
    }
  }
}

/**
 * Draws cards for the enemy until their hand is full (5 cards).
 * If the enemy's deck is empty, no more cards can be drawn.
 */
function drawCardsForEnemy() {
  const cardsToDraw = Math.min(5 - enemyHand.length, enemyDeck.length);
  for (let i = 0; i < cardsToDraw; i++) {
    const enemyDrawnCard = enemyDeck.shift();
    if (enemyDrawnCard) {
      enemyHand.push(enemyDrawnCard);
      logToResults(`🃏 Enemy draws ${enemyDrawnCard.name}`);

      const enemyHandElement = document.getElementById("enemy-hand");
      if (enemyHandElement) {
        enemyHandElement.appendChild(createCardElement(enemyDrawnCard, determineCardType(enemyDrawnCard)));
        if (debugMode) logDebug(`DEBUG: Enemy hand updated with ${enemyDrawnCard.name}`);
      } else {
        logError(`🚨 ERROR: Failed to create card element for ${enemyDrawnCard.name}`);
      }
    } else {
      logWarn("⚠️ Enemy deck is empty, cannot draw more cards.");
    }
  }
}

// 🤖 **Enemy AI Places a Card**
export function enemyPlaceCard() {
  return new Promise((resolve, reject) => {
    const openSlots = getEnemyOpenSlots();
    if (openSlots.length === 0) {
      logWarn("⚠️ No open slots for enemy to place a card.");
      resolve();
      return;
    }

    const card = enemyHand.shift();
    if (!card) {
      logWarn("⚠️ Enemy hand is empty, cannot place a card.");
      resolve();
      return;
    }

    const slot = openSlots[Math.floor(Math.random() * openSlots.length)];
    placeCardInBattleZone(card, `enemy-${slot}-zone`, updateEnemyBattleCard, "Enemy");
    setEnemyHasPlacedCard(true);
    gameState.playerHasPlacedCard = false; // Reset playerHasPlacedCard at the end of each turn
    resolve();
  });
}
