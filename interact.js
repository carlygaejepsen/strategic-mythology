// interact.js

import { 
  playerHand, enemyHand, gameState, 
  currentPlayerBattleCards, currentEnemyBattleCards, 
  playerDeck, enemyDeck 
} from "./config.js";
import { 
  createCardElement, determineCardType 
} from "./cards.js";
import { 
  updatePlayerBattleCard, enemyPlaceCard, updateHands 
} from "./card-display.js";
import { logToResults, updateInstructionText, onGameStateChange, onEnemyStateChange } from "./ui-display.js";

// Global selection variables for this turn.
export let selectedAttacker = null;
export let selectedDefender = null;
export let selectedCombo = null; // Supports combos

// 🎴 Draw Cards to Fill Hands
export function drawCardsToFillHands() {
  console.log("DEBUG: Drawing cards - Player Hand:", playerHand, "Enemy Hand:", enemyHand);

  if (playerHand.length < 6 && playerDeck.length > 0) {
    const drawn = playerDeck.shift();
    playerHand.push(drawn);
    logToResults(`🃏 Player draws ${drawn.name}`);
  }

  if (enemyHand.length < 6 && enemyDeck.length > 0) {
    const drawn = enemyDeck.shift();
    enemyHand.push(drawn);
    logToResults(`🃏 Enemy draws ${drawn.name}`);
  }
  
  updateHands();
}

// 🎯 Selection Functions
export function setSelectedAttacker(card) {
  if (!card) return;
  selectedAttacker = card;
  console.log(`🎯 Selected Attacker: ${card.name}`);
  checkComboAvailability();
}

export function setSelectedDefender(card) {
  if (!card) return;
  selectedDefender = card;
  console.log(`🛡️ Selected Defender: ${card.name}`);
  updateInstructionText("play-turn");
}

export function setSelectedCombo(combo) {
  if (!combo) return;
  selectedCombo = combo;
  console.log(`🔥 Combo selected: ${combo.name}`);
  updateInstructionText("select-defender");
}

// Internal helper: Check if a combo option is available.
function checkComboAvailability() {
  if (playerHasComboOption()) {
    updateInstructionText("select-combo");
  } else {
    updateInstructionText("select-defender");
  }
}

// Returns true if the selected attacker has a 'comboAvailable' flag or if any card in the player's hand is an ability.
function playerHasComboOption() {
  if (selectedAttacker && selectedAttacker.comboAvailable) return true;
  return playerHand.some(card => determineCardType(card) === "ability");
}

// ✅ Sets whether the player has placed a card.
export function setPlayerHasPlacedCard(value) {
  gameState.playerHasPlacedCard = value;
  if (gameState.playerHasPlacedCard && gameState.enemyHasPlacedCard) {
    onGameStateChange("select-attacker");
  }
}

// ✅ Sets whether the enemy has placed a card.
export function setEnemyHasPlacedCard(value) {
  gameState.enemyHasPlacedCard = value;
  if (typeof onEnemyStateChange === "function") {
    onEnemyStateChange("enemy-select-attacker");
  } else {
    console.error("🚨 ERROR: onEnemyStateChange is not defined!");
  }
}

// 🃏 Place a Card in the Battle Zone
export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
  console.log(`DEBUG: Attempting to place ${card.name} in ${battleZoneId}`);
  const battleZone = document.getElementById(battleZoneId);
  if (!battleZone) return;
  
  // Clear the zone before placing the new card.
  battleZone.innerHTML = "";
  const type = determineCardType(card);
  if (!["char", "essence", "ability"].includes(type)) {
    console.error(`🚨 ERROR: Invalid card type '${type}' for ${card.name}!`);
    return;
  }
  const cardElement = createCardElement(card, type);
  battleZone.appendChild(cardElement);
  updateFunction(card, type);
  
  // Update the corresponding battle zone state.
  if (owner === "Player") {
    currentPlayerBattleCards[type] = card;
  } else {
    currentEnemyBattleCards[type] = card;
  }
  console.log(`🔄 ${owner} placed a ${type} card: ${card.name}`);
  return cardElement;
}

// 🎮 Handle Card Click 2.0
export function handleCardClick(card) {
  if (!card || !card.name) {
    console.warn("⚠️ Invalid card click detected.");
    return;
  }
  console.log(`DEBUG: Clicked on card: ${card.name}`);
  const type = determineCardType(card);

  // Check if the card is already in a battle zone.
  const inPlayerBattle = Object.values(currentPlayerBattleCards).includes(card);
  const inEnemyBattle = Object.values(currentEnemyBattleCards).includes(card);

  if (inPlayerBattle) {
    // If no attacker is selected, use this card as the attacker.
    if (!selectedAttacker) {
      setSelectedAttacker(card);
      console.log(`✅ Attacker selected: ${card.name}`);
      // Prompt: You may now optionally click another card to add a combo, or select a defender.
      updateInstructionText("select-defender (or click a different card for a combo)");
      updateEnemyStatus("enemy-select-defender");
      return;
    }
    // If an attacker is already selected and the clicked card is different, treat it as a combo selection.
    if (selectedAttacker !== card) {
      setSelectedCombo(card);
      console.log(`🔥 Combo selected: ${card.name}`);
      updateInstructionText("select-defender");
      updateEnemyStatus("enemy-select-defender");
      return;
    }
    console.warn("⚠️ This card is already selected as the attacker.");
    return;
  }

  if (inEnemyBattle) {
    // Handle defender selection.
    if (selectedDefender === card) {
      console.warn("⚠️ This card is already selected as the defender.");
      return;
    }
    setSelectedDefender(card);
    console.log(`✅ Defender selected: ${card.name}`);
    updateInstructionText("play-turn");
    updateEnemyStatus("enemy-waiting");
    return;
  }

  // If the card is in the player's hand, attempt to place it.
  if (playerHand.includes(card)) {
    if (gameState.playerHasPlacedCard) {
      console.warn("⚠️ You can only place one card per turn.");
      return;
    }
    // Allow placement regardless of card type.
    if (!currentPlayerBattleCards[type] || type === "essence" || type === "ability" || type === "char") {
      placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");
      const index = playerHand.indexOf(card);
      if (index !== -1) playerHand.splice(index, 1);
      updateHands();
      setPlayerHasPlacedCard(true);
      enemyPlaceCard();
    } else {
      console.warn(`⚠️ You already have a ${type} card in battle.`);
    }
    return;
  }
  
  console.warn("⚠️ Invalid selection. Place a card first, then select your attacker, combo, and defender.");
}

// Helper: Determines if a card qualifies as a combo card.
function isComboCard(card) {
  return determineCardType(card) === "ability" && Boolean(selectedAttacker);
}

// Resets turn selections (attacker, defender, and combo).
export function resetTurnSelections() {
  selectedAttacker = null;
  selectedDefender = null;
  selectedCombo = null;
  console.log("🔄 Selections reset.");
}
