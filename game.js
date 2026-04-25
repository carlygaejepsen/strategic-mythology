// game.js

import {
  loadConfigFiles,
  loadAllCards,
  playerDeck,
  enemyDeck,
  playerHand,
  enemyHand,
  currentPlayerBattleCards,
  setCurrentPhase,
  turnPhases
} from "./config.js";
import {
  createCardElement,
  determineCardType
} from "./cards.js";
import { battleRound, manageTurn, startGame as startBattle } from "./battle.js";
import {
  onGameStateChange,
  onEnemyStateChange,
  updateDeckCounts
} from "./ui-display.js";
import { updateHands } from "./card-display.js";
import { logDebug, logError } from "./utils/logger.js";
import { selectCardToDiscard } from "./interact.js";

// 🎮 Initialize and Start Game
async function startGame() {
  try {
    logDebug("📝 Loading game configuration...");
    await loadConfigFiles();
    await loadAllCards();

    logDebug("🎴 Initializing battle...");
    startBattle();

    // Render initial hands for both players.
    updateHands();
    updateDeckCounts(playerDeck.length, enemyDeck.length); // Ensure deck count is updated

    // Ensure proper game state updates for UI
    onEnemyStateChange("enemy-start");

    // Update turn state to ensure UI consistency
    setCurrentPhase(turnPhases.SELECT_BATTLE_CARD);

    logDebug("✅ Game successfully started!");
  } catch (error) {
    logError("❌ ERROR starting game:", error);
  }
}

// Helper: Determines if a card qualifies as a combo card. (Used by UI or other modules if needed, keeping for potential expansion or removing if strictly dead)
// Actually, it's not used here, so removing it to clean up.

// Set up event listeners once the DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
  logDebug("📦 DOMContentLoaded event fired. Starting game...");
  startGame();

  const playTurnButton = document.getElementById("play-turn");

  if (playTurnButton) {
    playTurnButton.addEventListener("click", () => {
      logDebug("⚔️ Playing turn...");
      manageTurn();
    });
  } else {
    logError("❌ ERROR: 'Play Turn' button not found!");
  }
});
