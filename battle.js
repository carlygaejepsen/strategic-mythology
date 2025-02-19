import { processCombat } from "./battle-logic.js";
import {
    setSelectedAttacker,
    setSelectedDefender,
    setSelectedCombo,
    selectedAttacker,
    selectedDefender,
    selectedCombo
} from "./interact.js";

import {
    setPlayerHasPlacedCard,
    setEnemyHasPlacedCard,
    resetTurnSelections,
    resetSelections,
    drawCardsToFillHands,
    placeCardInBattleZone,
    updateEnemyBattleCard
} from "./update.js";

import {
    updateInstructionText,
    updateEnemyStatus,
    logToResults
} from "./ui-display.js";

import {
    getRandomCardFromZone,
    removeDefeatedCards,
    enemyPlaceCard
} from "./card-display.js";

import { gameState, currentPlayerBattleCards, currentEnemyBattleCards, playerDeck, enemyDeck } from "./config.js";
import { determineCardType } from "./cards.js";
import { debugMode } from "./config.js";
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

function getEnemyOpenSlots() {
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
        if (debugMode) logWarn("⚠️ Select an attacker and a defender before continuing.");
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
});
