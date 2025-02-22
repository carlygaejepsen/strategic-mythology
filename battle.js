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
    resetSelections, enemyPlaceCard 
} from "./update.js";

import { logDebug, logError, logWarn } from "./utils/logger.js";

let gameRunning = false;

// 🎮 **Start Game** - Ensures game initializes correctly
export function startGame() {
    resetSelections();
    drawCardsToFillHands();
    updateInstructionText("select-battle-card");
    updateEnemyStatus("enemy-start");
    if (debugMode) logDebug("✅ Game started!");
}

// Draw cards to fill hands
function drawCardsToFillHands() {
    while (playerHand.length < 5 && playerDeck.length > 0) {
        playerHand.push(playerDeck.pop());
    }
    while (enemyHand.length < 5 && enemyDeck.length > 0) {
        enemyHand.push(enemyDeck.pop());
    }
    updateHands();
    updateDeckCounts(playerDeck.length, enemyDeck.length); // Ensure deck count is updated after drawing cards
}

export function getEnemyOpenSlots() {
    const openSlots = [];

    if (!currentEnemyBattleCards["char"]) openSlots.push("char");
    if (!currentEnemyBattleCards["essence"]) openSlots.push("essence");
    if (!currentEnemyBattleCards["ability"]) openSlots.push("ability");

    return openSlots;
}

// 🎮 **Manages an entire turn**
export function manageTurn() {
    if (!gameRunning) return;
    gameRunning = true;

    if (debugMode) logDebug("🔄 Starting turn management.");

    // ✅ Ensure the enemy always attempts to play a card before attacking
    enemyPlaceCard().then(() => {
        if (!gameState.playerHasPlacedCard || !gameState.enemyHasPlacedCard) {
            gameRunning = false;
            return;
        }

        if (playerDeck.length === 0 && enemyDeck.length === 0) {
            logToResults("🏁 It's a draw!");
            gameRunning = false;
            return;
        }
        battleRound();

        setTimeout(() => {
            resetSelections().then(() => {
                drawCardsToFillHands().then(() => {
                    updateInstructionText("select-battle-card");
                    gameState.playerHasPlacedCard = false; // Reset the flag for the next turn
                    gameState.enemyHasPlacedCard = false; // Reset the flag for the next turn
                    gameRunning = false;
                    if (debugMode) logDebug("🔄 Turn management completed.");
                });
            });
        }, 1000);
    }).catch(error => {
        logError(`❌ Error during enemyPlaceCard: ${error}`);
        gameRunning = false;
    });
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
    setTimeout(enemyTurn, 500);
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
    setTimeout(endTurn, 500);
}

// 🔄 **End Turn and Prepare Next Round**
function endTurn() {
    updateInstructionText("select-battle-card");
    updateEnemyStatus("enemy-start");
    resetSelections().then(() => {
        setTimeout(() => {
            updateInstructionText("select-battle-card");
            updateEnemyStatus("enemy-start");
            drawCardsToFillHands();
        }, 500);
    });
    setTimeout(resetSelections, 500);
    updateDeckCounts(playerDeck.length, enemyDeck.length);
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
