// game.js

import { 
  loadConfigFiles, 
  loadAllCards, 
  playerDeck, 
  enemyDeck, 
  playerHand, 
  enemyHand, 
  cardTemplates, 
  gameConfig 
} from "./config.js";

import { dealStartingHands, createCardElement, determineCardType } from "./cards.js";
import { battleRound } from "./battle.js";
import { 
  onGameStateChange, 
  onEnemyStateChange, 
  updateInstructionText 
} from "./ui-display.js"; 
import { updateHands } from "./card-display.js";

// 🎮 Initialize and Start Game
async function startGame() {
  try {
    console.log("📥 Loading game configuration...");
    await loadConfigFiles();
    await loadAllCards();

    console.log("🎴 Dealing starting hands...");
    dealStartingHands();

    // Render the initial hands for both players without duplicating elements.
    updateHands();

    // Ensure proper game state updates for UI
    onGameStateChange("select-battle-card");      
    onEnemyStateChange("enemy-start");  

    // Directly update the instruction text to avoid missing UI updates
    updateInstructionText("select-battle-card");

    console.log("✅ Game successfully started!");
  } catch (error) {
    console.error("❌ ERROR starting game:", error);
  }
}

// Set up event listeners once the DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
  startGame();

  const playTurnButton = document.getElementById("play-turn");
  if (playTurnButton) {
    playTurnButton.addEventListener("click", () => {
      console.log("⚔️ Playing turn...");
      battleRound();

      // Update hands after the battle round without duplicating cards.
      updateHands();
    });
  } else {
    console.error("❌ ERROR: 'Play Turn' button not found!");
  }
});
