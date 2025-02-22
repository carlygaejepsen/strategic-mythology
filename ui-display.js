// ui-display.js - Handles all UI updates, including instruction box, enemy status, and result logs

import { gameState, debugMode, playerDeck, enemyDeck } from "./config.js";
import { logDebug, logError, logWarn } from "./utils/logger.js";

// Check if running in Node.js environment
const isNode = typeof window === 'undefined';

// ✅ Updates Player Instruction Box (only when changed)
export function updateInstructionText(phase) {
    if (isNode) return; // Skip if running in Node.js environment

    const instructionBox = document.getElementById("instruction-box");
    if (!instructionBox) {
        logError("❌ ERROR: Instruction box not found in DOM!");
        return;
    }

    const instructionMessages = {
        "select-battle-card": "Choose a card to send to the battle zone.",
        "select-attacker": "Select your attacker.",
        "select-combo": "Choose an ability to enhance your attack.",
        "select-defender-or-combo": "Build a combo or choose which enemy to attack.",
        "select-defender": "Choose which enemy to attack.", 
        "play-turn": "Click 'Play Turn' to continue.",
        "battling": "Battling...",
        "waiting": "Waiting for opponent...",
        "discard-to-deck": "Discard cards to the deck."
    };

    if (instructionMessages[phase] && instructionBox.innerText !== instructionMessages[phase]) {
        instructionBox.innerText = instructionMessages[phase];
        if (debugMode) logDebug(`📝 Instruction Updated: ${instructionMessages[phase]}`);
    }
}

// ✅ Updates Enemy Status UI (only when changed)
export function updateEnemyStatus(phase) {
    if (isNode) return; // Skip if running in Node.js environment

    const enemyStatusBox = document.getElementById("enemy-status-box");
    if (!enemyStatusBox) {
        logError("❌ ERROR: Enemy status box not found!");
        return;
    }

    const enemyMessages = {
        "enemy-start": "Enemy is preparing...",
        "enemy-select-battle-card": "Enemy is adding a card to the battle zone.",
        "enemy-select-attacker": "Enemy is selecting an attacker.",
        "enemy-select-defender": "Enemy is choosing a target.",
        "enemy-play-turn": "Enemy is attacking...",
        "enemy-battling": "Enemy is battling...",
        "enemy-combo": "Enemy is trying a combo!",
        "enemy-waiting": "Enemy is thinking..."
    };

    if (enemyMessages[phase] && enemyStatusBox.textContent !== enemyMessages[phase]) {
        enemyStatusBox.textContent = enemyMessages[phase];
        if (debugMode) logDebug(`🤖 Enemy Status Updated: ${enemyMessages[phase]}`);
    }
}

// ✅ Wrapper: Updates Player Instruction UI based on game state changes
export function onGameStateChange(newState) {
    if (debugMode) logDebug(`🔄 Game state changed: ${newState}`);
    updateInstructionText(newState);
}

// ✅ Wrapper: Updates Enemy Phase UI based on game state changes
export function onEnemyStateChange(newState) {
    if (debugMode) logDebug(`🔄 Enemy state changed: ${newState}`);
    updateEnemyStatus(newState);
}

// ✅ Logs battle events to the UI (Avoids redundant logging)
export function logToResults(message) {
    if (isNode) return; // Skip if running in Node.js environment

    const resultsLog = document.getElementById("results-log");
    if (!resultsLog) {
        logError("❌ ERROR: Results log element not found.");
        return;
    }
    const logEntry = document.createElement("div");
    logEntry.textContent = message;
    resultsLog.appendChild(logEntry);
    logDebug(`📝 Log entry added: ${message}`);
}

// ✅ Clears the results log when a new game starts
export function clearResultsLog() {
    if (isNode) return; // Skip if running in Node.js environment

    const logElement = document.getElementById("results-log");
    if (logElement) {
        logElement.innerHTML = "";
        if (debugMode) logDebug("🧹 Results log cleared.");
    } else {
        logError("❌ ERROR: Cannot clear log; results log not found.");
    }
}

// Function to update deck counts
export function updateDeckCounts(playerCount, enemyCount) {
    const playerDeckCountElement = document.getElementById('player-deck-count');
    const enemyDeckCountElement = document.getElementById('enemy-deck-count');

    if (playerDeckCountElement) {
        playerDeckCountElement.textContent = playerCount;
    }
    if (enemyDeckCountElement) {
        enemyDeckCountElement.textContent = enemyCount;
    }
}

// ✅ Ensure UI is properly initialized when the game starts
if (!isNode) {
    window.addEventListener("DOMContentLoaded", () => {
        if (debugMode) logDebug("✅ UI Display module loaded successfully.");
        updateInstructionText("select-battle-card");
        updateEnemyStatus("enemy-start");

        // Ensure deck counts are updated on load
        updateDeckCounts(playerDeck.length, enemyDeck.length);
    });
}