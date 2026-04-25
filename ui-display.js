// ui-display.js - Handles all UI updates, including instruction box, enemy status, and result logs
import { gameState, debugMode, playerDeck, enemyDeck, turnPhases } from "./config.js";
import { logDebug, logError, logWarn } from "./utils/logger.js";

// Check if running in Node.js environment
const isNode = typeof window === 'undefined';

// ✅ Updates Player Instruction Box (only when changed)
export function updateInstructionText(phase) {
    if (isNode) return; // Skip if running in Node.js

    const instructionBox = document.getElementById("instruction-box");
    if (!instructionBox) {
        logError("❌ ERROR: Instruction box not found in DOM!");
        return;
    }

    // For phases not listed, default to a generic message.
    const instructionMessages = {
        [turnPhases.SELECT_BATTLE_CARD]: "Choose a card to send to the battle zone.",
        [turnPhases.SELECT_ATTACKER]: "Select your attacker.",
        [turnPhases.SELECT_COMBO]: "Choose an ability to enhance your attack.",
        [turnPhases.SELECT_DEFENDER_OR_COMBO]: "Build a combo or choose which enemy to attack.",
        [turnPhases.SELECT_DEFENDER]: "Choose which enemy to attack.",
        [turnPhases.PLAY_TURN]: "Click 'Play Turn' to continue.",
        [turnPhases.COMBAT]: "Battling...",
        [turnPhases.WAITING]: "Waiting for opponent...",
        [turnPhases.DISCARD_TO_DECK]: "Discard cards to the deck.",
    };

    let newMessage = instructionMessages[phase];
    if (!newMessage) {
        // fallback message if the phase is not in our map
        newMessage = `Current phase: ${phase}`;
    }

    if (instructionBox.innerText !== newMessage) {
        instructionBox.innerText = newMessage;
        if (debugMode) {
            logDebug(`📝 Instruction Updated: ${newMessage}`);
        }
    }
}

// ✅ Updates Enemy Status UI (only when changed)
export function updateEnemyStatus(phase) {
    if (isNode) return; // Skip if running in Node.js

    const enemyStatusBox = document.getElementById("enemy-status-box");
    if (!enemyStatusBox) {
        logError("❌ ERROR: Enemy status box not found!");
        return;
    }

    const enemyMessages = {
        "enemy-start": "Enemy is preparing...",
        [turnPhases.ENEMY_SELECTION]: "Enemy is adding a card to the battle zone.",
        [turnPhases.ENEMY_ATTACKER]: "Enemy is selecting an attacker.",
        [turnPhases.ENEMY_DEFENDER]: "Enemy is choosing a target.",
        [turnPhases.ENEMY_PLAY_TURN]: "Enemy is attacking...",
        "enemy-battling": "Enemy is battling...",
        "enemy-combo": "Enemy is trying a combo!",
        "enemy-waiting": "Enemy is thinking..."
    };

    let newEnemyMessage = enemyMessages[phase];
    if (!newEnemyMessage) {
        // fallback for any unrecognized phase
        newEnemyMessage = `Enemy phase: ${phase}`;
    }

    if (enemyStatusBox.textContent !== newEnemyMessage) {
        enemyStatusBox.textContent = newEnemyMessage;
        if (debugMode) {
            logDebug(`🤖 Enemy Status Updated: ${newEnemyMessage}`);
        }
    }
}

// ✅ Wrapper: Updates Player Instruction UI based on game state changes
export function onGameStateChange(newState) {
    if (debugMode) {
        logDebug(`🔄 Game state changed: ${newState}`);
    }
    updateInstructionText(newState);
}

// ✅ Wrapper: Updates Enemy Phase UI based on game state changes
export function onEnemyStateChange(newState) {
    if (debugMode) {
        logDebug(`🔄 Enemy state changed: ${newState}`);
    }
    updateEnemyStatus(newState);
}

// ✅ Logs battle events to the UI (Avoids redundant logging)
export function logToResults(message) {
    if (isNode) return; // Skip if running in Node.js

    const resultsLog = document.getElementById("results-log");
    if (!resultsLog) {
        logError("❌ ERROR: Results log element not found.");
        return;
    }
    const logEntry = document.createElement("div");
    logEntry.textContent = message;
    resultsLog.appendChild(logEntry);
    if (debugMode) {
        logDebug(`📝 Log entry added: ${message}`);
    }
}

// ✅ Clears the results log when a new game starts
export function clearResultsLog() {
    if (isNode) return; // Skip if running in Node.js

    const logElement = document.getElementById("results-log");
    if (logElement) {
        logElement.innerHTML = "";
        if (debugMode) {
            logDebug("🧹 Results log cleared.");
        }
    } else {
        logError("❌ ERROR: Cannot clear log; results log not found.");
    }
}

// Function to update deck counts
export function updateDeckCounts(playerCount, enemyCount) {
    if (isNode) return; // Skip if running in Node.js

    const playerDeckCountElement = document.getElementById('player-deck-count');
    const enemyDeckCountElement = document.getElementById('enemy-deck-count');

    if (playerDeckCountElement) {
        playerDeckCountElement.textContent = playerCount;
    }
    if (enemyDeckCountElement) {
        enemyDeckCountElement.textContent = enemyCount;
    }
}

export function updatePlayerHPDisplay(hp) {
    if (isNode) return;
    const el = document.getElementById("player-hp");
    if (el) el.textContent = hp;
}

export function updateEnemyHPDisplay(hp) {
    if (isNode) return;
    const el = document.getElementById("enemy-hp");
    if (el) el.textContent = hp;
}

// ✅ Ensure UI is properly initialized when the game starts
if (!isNode) {
    window.addEventListener("DOMContentLoaded", () => {
        if (debugMode) {
            logDebug("✅ UI Display module loaded successfully.");
        }
        updateInstructionText(turnPhases.SELECT_BATTLE_CARD);
        updateEnemyStatus("enemy-start");

        // Ensure deck counts are updated on load
        updateDeckCounts(playerDeck.length, enemyDeck.length);
    });
}