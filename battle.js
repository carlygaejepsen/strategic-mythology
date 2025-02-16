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
    drawCardsToFillHands
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

import { gameState, currentPlayerBattleCards, currentEnemyBattleCards, playerDeck, enemyDeck } from "./config.js";
import { determineCardType } from "./cards.js";

let gameRunning = false;

// 🎮 **Start Game** - Ensures game initializes correctly
export function startGame() {
    resetSelections();
    drawCardsToFillHands();
    updateInstructionText("select-battle-card");
    updateEnemyStatus("enemy-start");
    console.log("✅ Game started!");
}

// 🎮 **Manages an entire turn**
export function manageTurn() {
    if (gameRunning) return;
    gameRunning = true;

    if (!gameState.playerHasPlacedCard || !gameState.enemyHasPlacedCard) {
        console.warn("⚠️ Both players must place a card before starting the round.");
        gameRunning = false;
        return;
    }

    battleRound();

    setTimeout(() => {
        if (playerDeck.length === 0 || enemyDeck.length === 0) {
            logToResults(playerDeck.length === 0 ? "🏁 Player wins!" : "🏁 Enemy wins!");
            gameRunning = false;
            return;
        }

        resetSelections();
        drawCardsToFillHands();
        updateInstructionText("select-card");

        gameRunning = false;
    }, 1000);
}

// ⚔️ **Handles the battle round**
function battleRound() {
    if (!selectedAttacker || !selectedDefender) {
        console.warn("⚠️ Select an attacker and a defender before continuing.");
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
    drawCardsToFillHands();
    setTimeout(resetSelections, 500);
}

// ✅ **Initialize game on page load**
document.addEventListener("DOMContentLoaded", () => {
    setTimeout (startGame, 100);

    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", manageTurn);
    } else {
        console.error("❌ ERROR: 'Play Turn' button not found!");
    }
});

export { battleRound };
