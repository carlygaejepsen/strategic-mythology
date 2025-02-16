// ui-display.js - Handles all UI updates, including instruction box, enemy status, and result logs

import { gameState } from "./config.js";

// ✅ Updates Player Instruction Box
export function updateInstructionText(phase) {
    const instructionBox = document.getElementById("instruction-box");
    if (!instructionBox) {
        console.error("❌ ERROR: Instruction box not found in DOM!");
        return;
    }

    const instructionMessages = {
        "select-battle-card": "Choose a card to send to the battle zone.",
        "select-attacker": "Select your attacker.",
        "select-combo": "Choose an ability to enhance your attack.",
        "select-defender-or-combo": "Build a combo or choose which enemy to attack.",
        "play-turn": "Click 'Play Turn' to continue.",
        "battling": "Battling...",
        "waiting": "Waiting for opponent..."
    };

    // ✅ Ensure the instruction box updates properly
    if (instructionMessages[phase]) {
        instructionBox.innerText = instructionMessages[phase];
        console.log(`📝 Instruction Updated: ${instructionMessages[phase]}`);
    } else {
        console.warn(`⚠️ WARNING: Unrecognized phase "${phase}". Instruction box left unchanged.`);
    }
}

// ✅ Updates Enemy Status UI
export function updateEnemyStatus(phase) {
    const enemyStatusBox = document.getElementById("enemy-status-box");
    if (!enemyStatusBox) {
        console.error("❌ ERROR: Enemy status box not found!");
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

    if (enemyMessages[phase]) {
        enemyStatusBox.textContent = enemyMessages[phase];
        console.log(`🤖 Enemy Status Updated: ${enemyMessages[phase]}`);
    } else {
        console.warn(`⚠️ WARNING: Unrecognized enemy phase "${phase}". Enemy status left unchanged.`);
    }
}

// ✅ Wrapper: Updates Player Instruction UI based on game state changes
export function onGameStateChange(newState) {
    console.log(`🔄 Game state changed: ${newState}`);
    updateInstructionText(newState);
}

// ✅ Wrapper: Updates Enemy Phase UI based on game state changes
export function onEnemyStateChange(newState) {
    console.log(`🔄 Enemy state changed: ${newState}`);
    updateEnemyStatus(newState);
}

// ✅ Logs battle events to the UI
export function logToResults(message) {
    const logElement = document.getElementById("results-log");
    if (!logElement) {
        console.error("❌ ERROR: Results log not found!");
        return;
    }

    const entry = document.createElement("p");
    entry.textContent = message;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight; // Auto-scroll to latest message
}

// ✅ Clears the results log when a new game starts
export function clearResultsLog() {
    const logElement = document.getElementById("results-log");
    if (logElement) {
        logElement.innerHTML = "";
        console.log("🧹 Results log cleared.");
    } else {
        console.error("❌ ERROR: Cannot clear log; results log not found.");
    }
}

// ✅ Ensure UI is properly initialized when the game starts
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ UI Display module loaded successfully.");
    updateInstructionText("select-battle-card");
    updateEnemyStatus("enemy-start");
});
