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
  updateInstructionText 
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

// Set up event listeners once the DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
  logDebug("📦 DOMContentLoaded event fired. Starting game...");
  startGame();
});

// Ensure the DOM is fully loaded before accessing elements.
window.addEventListener("load", () => {
  logDebug("📦 Window load event fired. Setting up event listeners...");
  const playTurnButton = document.getElementById("play-turn");
  if (playTurnButton) {
    playTurnButton.addEventListener("click", () => {
      logDebug("⚔️ Playing turn...");
      battleRound();

      // Update hands after battle round.
      updateHands();
    });
  } else {
    logError("❌ ERROR: 'Play Turn' button not found!");
  }
});
