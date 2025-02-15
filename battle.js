// battle.js

import { processCombat } from "./battle-logic.js";
import {
  drawCardsToFillHands,
  selectedAttacker,
  selectedDefender,
  setSelectedAttacker,
  setSelectedDefender,
  setSelectedCombo,
  selectedCombo
} from "./interact.js";

import {
  setPlayerHasPlacedCard,
  setEnemyHasPlacedCard,
  resetTurnSelections,
  resetSelections
} from "./update.js";
import {
  updateInstructionText,
  updateEnemyStatus,
  logToResults
} from "./ui-display.js";
import {
  getRandomCardFromZone,
  removeDefeatedCards
} from "./card-display.js";
import { gameState, playerHand, currentPlayerBattleCards, currentEnemyBattleCards } from "./config.js";
import { determineCardType } from "./cards.js";

let gameRunning = false;

// Helper: Check if a combo option is available by looking for any "ability" card in the player's hand.
function playerHasComboOption() {
  const hasCombo = playerHand.some(card => determineCardType(card) === "ability");
  console.log(`DEBUG: Checking combo options - Available: ${hasCombo}`);
  return hasCombo;
}

// 🎮 Main Game Loop
export function gameLoop() {
  if (gameRunning) return; // Prevent multiple triggers
  gameRunning = true;
  console.log("DEBUG: New battle round starting...");

  // Ensure both players have placed a card before continuing.
  if (!gameState.playerHasPlacedCard || !gameState.enemyHasPlacedCard) {
    console.warn("DEBUG: Warning - Both players must place a card before starting the round.");
    updateInstructionText("select-battle-card");
    updateEnemyStatus("enemy-select-battle-card");
    gameRunning = false;
    return;
  }

  updateInstructionText("select-attacker");
  updateEnemyStatus("enemy-select-attacker");
}

// Handles player selecting an attacker.
export function handleSelectAttacker(card) {
  if (!card) {
    console.warn("DEBUG: No attacker card selected.");
    return;
  }
  setSelectedAttacker(card);
  console.log(`DEBUG: Attacker selected: ${card.name}`);

  if (playerHasComboOption()) {
    updateInstructionText("select-combo");
    updateEnemyStatus("enemy-combo");
  } else {
    updateInstructionText("select-defender");
    updateEnemyStatus("enemy-select-defender");
  }
}

// Handles player selecting a combo.
export function handleSelectCombo(combo) {
  if (!combo) {
    console.warn("DEBUG: No combo card selected.");
    return;
  }
  setSelectedCombo(combo);
  console.log(`DEBUG: Combo selected: ${combo.name}`);
  updateInstructionText("select-defender");
  updateEnemyStatus("enemy-select-defender");
}

// Handles player selecting a defender.
export function handleSelectDefender(card) {
  if (!card) {
    console.warn("DEBUG: No defender card selected.");
    return;
  }
  setSelectedDefender(card);
  console.log(`DEBUG: Defender selected: ${card.name}`);
  updateInstructionText("play-turn");
  updateEnemyStatus("enemy-waiting");
}

// Executes a battle round.
function battleRound() {
  console.log("DEBUG: Battle round begins!");

  if (!selectedAttacker || !selectedDefender) {
    console.warn("DEBUG: Select an attacker and a defender before continuing.");
    return;
  }

  updateInstructionText("battling");
  updateEnemyStatus("enemy-battling");

  if (selectedCombo) {
    console.log(`DEBUG: ${selectedAttacker.name} uses ${selectedCombo.name} while attacking ${selectedDefender.name}`);
    processCombat(selectedAttacker, selectedDefender, selectedCombo);
  } else {
    console.log(`DEBUG: ${selectedAttacker.name} attacks ${selectedDefender.name}`);
    processCombat(selectedAttacker, selectedDefender);
  }

  removeDefeatedCards();

  const enemyAttacker = getRandomCardFromZone(currentEnemyBattleCards);
  const playerDefender = getRandomCardFromZone(currentPlayerBattleCards);

  if (enemyAttacker && playerDefender) {
    console.log(`DEBUG: Enemy AI: ${enemyAttacker.name} attacks ${playerDefender.name}`);
    processCombat(enemyAttacker, playerDefender);
  } else {
    console.log("DEBUG: Enemy AI has no valid attack this turn.");
  }

  removeDefeatedCards();

  updateInstructionText("select-battle-card");
  updateEnemyStatus("enemy-start");

  drawCardsToFillHands();

  setTimeout(resetSelections, 500);
  console.log("DEBUG: Battle round complete. Click 'Play Turn' to continue.");
}

// Initialize turn states on DOMContentLoaded.
document.addEventListener("DOMContentLoaded", () => {
  console.log("DEBUG: Initializing game states...");
  updateInstructionText("select-battle-card");
  updateEnemyStatus("enemy-start");

  const playTurnButton = document.getElementById("play-turn");
  if (playTurnButton) {
    playTurnButton.addEventListener("click", battleRound);
  } else {
    console.error("DEBUG: 'Play Turn' button not found!");
  }
});

// Export battleRound so it can be called from other modules.
export { battleRound };
