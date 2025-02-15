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
  enemyPlaceCard, updateHands 
} from "./card-display.js";
import { 
  updatePlayerBattleCard, placeCardInBattleZone, 
  setPlayerHasPlacedCard, setEnemyHasPlacedCard, 
  resetTurnSelections 
} from "./update.js";
import { 
  logToResults, updateInstructionText, onGameStateChange, 
  onEnemyStateChange, updateEnemyStatus 
} from "./ui-display.js";

// Global selection variables for this turn.
let selectedAttacker = null;
let selectedDefender = null;
let selectedCombo = null;

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

// Resets attacker, defender, and combo selection at the start of each turn
export function resetSelectionsForNewTurn() {
  console.log("🔄 Resetting selections for new turn...");
  selectedAttacker = null;
  selectedDefender = null;
  selectedCombo = null;
  resetTurnSelections(); // Ensures the UI updates accordingly
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
  return playerHand.some(card => ["char", "essence", "ability"].includes(determineCardType(card)));
}

// 🎮 Handle Card Click 3.0
export function handleCardClick(card) {
  if (!card || !card.name) {
    console.warn("⚠️ Invalid card click detected.");
    return;
  }

  console.log(`DEBUG: Clicked on card: ${card.name}`);
  const type = determineCardType(card);

  // 🎴 **Placing a Card from Player Hand**
  if (playerHand.includes(card)) {
    if (gameState.playerHasPlacedCard) {
      console.warn("⚠️ You can only place one card per turn.");
      return;
    }
    
    if (!currentPlayerBattleCards[type]) {
      placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");

      // ✅ Remove the placed card from the player's hand
      playerHand.splice(playerHand.indexOf(card), 1);
      updateHands();

      setPlayerHasPlacedCard(true);
      updateInstructionText("select-attacker");
      enemyPlaceCard();
    } else {
      console.warn(`⚠️ You already have a ${type} card in battle.`);
    }
    return;
  }

  // 🛡️ **Checking if the card is in a battle zone**
  const inPlayerBattle = Object.values(currentPlayerBattleCards).includes(card);
  const inEnemyBattle = Object.values(currentEnemyBattleCards).includes(card);

  // 🎯 **Selecting an Attacker**
  if (inPlayerBattle) {
    if (!selectedAttacker) {
      setSelectedAttacker(card);
      console.log(`✅ Attacker selected: ${card.name}`);
      updateInstructionText("select-defender (or click a different card for a combo)");
      updateEnemyStatus("enemy-select-defender");
      return;
    }

    if (selectedAttacker === card) {
      // ❌ Deselect Attacker if clicked again
      setSelectedAttacker(null);
      console.log(`❌ Attacker deselected: ${card.name}`);
      updateInstructionText("select-attacker");
      return;
    }

    if (selectedAttacker !== card) {
      // 🔥 Select for Combo if different from first attacker
      setSelectedCombo(card);
      console.log(`🔥 Combo selected: ${card.name}`);
      updateInstructionText("select-defender");
      return;
    }
  }

  // 🛡️ **Selecting/Deselecting a Defender**
  if (inEnemyBattle) {
    if (!selectedDefender) {
      setSelectedDefender(card);
      console.log(`✅ Defender selected: ${card.name}`);
      updateInstructionText("play-turn");
      updateEnemyStatus("enemy-waiting");
      return;
    }

    if (selectedDefender === card) {
      // ❌ Deselect Defender if clicked again
      setSelectedDefender(null);
      console.log(`❌ Defender deselected: ${card.name}`);
      updateInstructionText("select-defender");
      return;
    }
  }

  console.warn("⚠️ Invalid selection. Place a card first, then select your attacker, combo, and defender.");
}

// ✅ Exporting Functions
export {
  selectedAttacker,
  selectedDefender,
  selectedCombo
};
