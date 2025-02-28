console.log("battle.js loaded");
import { processCombat } from "./battle-logic.js";
import {
    selectedAttacker,
    selectedDefender,
    selectedCombo
} from "./interact.js";
if (typeof document === "undefined") {
    throw new Error("This code must be run in a browser environment.");
}
import {
    playerHand, enemyHand, playerDeck, enemyDeck, gameState, debugMode, setDebugMode, currentEnemyBattleCards, currentPlayerBattleCards
} from "./config.js";

import { 
    logToResults, updateInstructionText, updateEnemyStatus, updateDeckCounts 
} from "./ui-display.js";

import { 
    updateHands, removeDefeatedCards, getRandomCardFromZone 
} from "./card-display.js";

import { 
    resetTurnSelections, enemyPlaceCard, placeCardInBattleZone, setPlayerHasPlacedCard, setEnemyHasPlacedCard, updatePlayerBattleCard, updateEnemyBattleCard,   drawCardsForPlayer,
    drawCardsForEnemy
} from "./update.js";

import { logDebug, logError, logWarn } from "./utils/logger.js";

let gameRunning = false;

// 🎮 **Start Game** - Ensures game initializes correctly
export function startGame() {
    drawCardsToFillHands();
    updateInstructionText("select-battle-card");
    updateEnemyStatus("enemy-start");
    if (debugMode) logDebug("✅ Game started!");
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

export function getEnemyOpenSlots() {
    const openSlots = [];

    if (!currentEnemyBattleCards["char"]) openSlots.push("char");
    if (!currentEnemyBattleCards["essence"]) openSlots.push("essence");
    if (!currentEnemyBattleCards["ability"]) openSlots.push("ability");

    return openSlots;
}

// ⚔️ **Handles the battle round**
export function battleRound() {
    if (!selectedAttacker || !selectedDefender) {
        logWarn("⚠️ Select an attacker and a defender before continuing.");
        gameRunning = false;
        return;
    }

    if (selectedCombo) {
        logToResults(`🔥 ${selectedAttacker.name} uses ${selectedCombo.name} while attacking ${selectedDefender.name}`);
        processCombat(selectedAttacker, selectedDefender, true);
    } else {
        logToResults(`⚔️ ${selectedAttacker.name} attacks ${selectedDefender.name}`);
        processCombat(selectedAttacker, selectedDefender);
    }

    removeDefeatedCards();
    setTimeout(() => {
        enemyTurn();
        resetTurnSelections(); // Reset selections after the enemy turn
    }, 500);
}

// 🤖 **Enemy AI Turn**
function enemyTurn() {
    const enemyAttacker = getRandomCardFromZone(currentEnemyBattleCards);
    const playerDefender = getRandomCardFromZone(currentPlayerBattleCards);
    if (!enemyAttacker || !playerDefender) {
        logWarn("⚠️ Enemy AI cannot find a valid attacker or defender.");
        gameRunning = false;
        return;
    }
    if (enemyAttacker && playerDefender) {
        logToResults(`🤖 Enemy AI: ${enemyAttacker.name} attacks ${playerDefender.name}`);
        processCombat(enemyAttacker, playerDefender);
    } else {
        logToResults("🤖 Enemy AI has no valid attack this turn.");
    }

    removeDefeatedCards();
    setTimeout(500);
}

export function manageTurn() {
    if (!gameRunning) return;
    gameRunning = true;

    if (debugMode) logDebug("🔄 Starting turn management.");

    // ✅ Ensure enemy places a card first
    enemyPlaceCard().then(() => {
        if (!gameState.playerHasPlacedCard || !gameState.enemyHasPlacedCard) {
            gameRunning = false;
            return;
        }

        battleRound();

        if (playerDeck.length === 0 && enemyDeck.length === 0) {
            logToResults("🏁 It's a draw!");
            gameRunning = false;
            return;
        }

        // ✅ Immediately reset the turn state instead of delaying it
        gameState.playerHasPlacedCard = false;
        gameState.enemyHasPlacedCard = false;
        gameRunning = false;
        if (debugMode) logDebug("🔄 Turn management completed.");

        // ✅ Continue with UI updates
        resetTurnSelections().then(() => {
            drawCardsToFillHands().then(() => {
                updateInstructionText("select-battle-card");
            });
        });
    }).catch(error => {
        logError(`❌ Error during enemyPlaceCard: ${error}`);
        gameRunning = false;
    });
}


// ✅ **Initialize game on page load**
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(startGame, 100);

    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", manageTurn);
    } else {
        logError("❌ ERROR: 'Play Turn' button not found!");
    }

    // Add a button or some mechanism to toggle debug mode
    const debugToggleButton = document.getElementById("debug-toggle");
    if (debugToggleButton) {
        debugToggleButton.addEventListener("click", () => {
            setDebugMode(!debugMode);
            logDebug(`Debug mode is now ${debugMode ? "ON" : "OFF"}`);
        });
    }
});
