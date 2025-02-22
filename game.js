// game.js

import { 
  loadConfigFiles, 
  loadAllCards, 
  playerDeck, 
  enemyDeck, 
  playerHand, 
  enemyHand 
} from "./config.js";
import { dealStartingHands, createCardElement, determineCardType } from "./cards.js";
import { battleRound } from "./battle.js";
import { 
  onGameStateChange, 
  onEnemyStateChange, 
  updateInstructionText, 
  updateDeckCounts 
} from "./ui-display.js"; 
import { updateHands } from "./card-display.js";
import { logDebug, logError } from "./utils/logger.js";

// 🎮 Initialize and Start Game
async function startGame() {
  try {
    logDebug("📝 Loading game configuration...");
    await loadConfigFiles();
    await loadAllCards();

    logDebug("🎴 Dealing starting hands...");
    dealStartingHands();

    // Render initial hands for both players.
    updateHands();
    updateDeckCounts(playerDeck.length, enemyDeck.length); // Ensure deck count is updated after dealing hands

    // Ensure proper game state updates for UI
    onGameStateChange("select-battle-card");      
    onEnemyStateChange("enemy-start");  

    // Update instruction text to ensure UI consistency
    updateInstructionText("select-battle-card");

    logDebug("✅ Game successfully started!");
  } catch (error) {
    logError("❌ ERROR starting game:", error);
  }
}

// Helper: Determines if a card qualifies as a combo card.
function isComboCard(card) {
  return determineCardType(card) === "ability" && Boolean(selectedAttacker);
}

// Internal helper: Check if a combo option is available.
function checkComboAvailability() {
  if (playerHasComboOption()) {
    updateInstructionText("select-combo");
  } else {
    updateInstructionText("select-defender-or-combo");
  }
}

function discardCard(card) {
  if (!card) {
    logError("❌ ERROR: No card selected to discard.");
    return;
  }

  const type = determineCardType(card);

  // Remove card from player's hand
  const handIndex = playerHand.indexOf(card);
  if (handIndex !== -1) {
    playerHand.splice(handIndex, 1);
    playerDeck.push(card); // Add card back to the deck
    logDebug(`🗑️ Discarded ${card.name} from hand.`);
    updateHands();
    updateDeckCounts(playerDeck.length, enemyDeck.length); // Ensure deck count is updated after discarding
    return;
  }

  // Remove card from player's battle zone
  if (currentPlayerBattleCards[type] === card) {
    currentPlayerBattleCards[type] = null;
    const battleZone = document.getElementById(`player-${type}-zone`);
    if (battleZone) {
      battleZone.innerHTML = "";
    }
    playerDeck.push(card); // Add card back to the deck
    logDebug(`🗑️ Discarded ${card.name} from battle zone.`);
    updateDeckCounts(playerDeck.length, enemyDeck.length); // Ensure deck count is updated after discarding
    return;
  }

  logError("❌ ERROR: Card not found in hand or battle zone.");
}

// Set up event listeners once the DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
  logDebug("📦 DOMContentLoaded event fired. Starting game...");
  startGame();

  const playTurnButton = document.getElementById("play-turn");
  const playerDeckElement = document.getElementById("player-deck");
  const enemyDeckElement = document.getElementById("enemy-deck");

  if (playTurnButton) {
    playTurnButton.addEventListener("click", () => {
      logDebug("⚔️ Playing turn...");
      battleRound();

      // Update hands after battle round.
      updateHands();
      updateDeckCounts(playerDeck.length, enemyDeck.length); // Ensure deck count is updated after updating hands
    });
  } else {
    logError("❌ ERROR: 'Play Turn' button not found!");
  }

  if (playerDeckElement) {
    playerDeckElement.addEventListener("click", () => {
      logDebug("🗑️ Discarding card...");
      // Implement logic to select a card to discard
      const cardToDiscard = selectCardToDiscard(); // You need to implement this function
      discardCard(cardToDiscard);
    });
  } else {
    logError("❌ ERROR: 'Player Deck' element not found!");
  }

  if (enemyDeckElement) {
    enemyDeckElement.addEventListener("click", () => {
      logDebug("🗑️ Discarding card...");
      // Implement logic to select a card to discard
      const cardToDiscard = selectCardToDiscard(); // You need to implement this function
      discardCard(cardToDiscard);
    });
  } else {
    logError("❌ ERROR: 'Enemy Deck' element not found!");
  }
});
