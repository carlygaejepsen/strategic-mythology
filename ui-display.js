// ui-display.js

// Updates Player Instruction Box
export function updateInstructionText(phase) {
    const instructionBox = document.getElementById("instruction-box");
    if (!instructionBox) return;

    const instructionMessages = {
        "select-battle-card": "Choose a card to send to the battle zone.",
        "select-attacker": "Select your attacker.",
        "select-combo": "Choose an ability to enhance your attack.",
        "select-defender-or-combo": "Build a combo or choose which enemy to attack.",
        "play-turn": "Click 'Play Turn' to continue.",
        "battling": "Battling...",
        "waiting": "Waiting for opponent...",
    };

}

// Updates Enemy Status UI
export function updateEnemyStatus(phase) {
    const enemyStatusBox = document.getElementById("enemy-status-box");
    if (!enemyStatusBox) return;

    const enemyMessages = {
        "enemy-start": "Enemy is preparing...",
        "enemy-select-battle-card": "Enemy is adding a card to the battle zone.",
        "enemy-select-attacker": "Enemy is selecting an attacker.",
        "enemy-select-defender": "Enemy is choosing a target.",
        "enemy-play-turn": "Enemy is attacking...",
        "enemy-battling": "Enemy is battling...",
        "enemy-combo": "Enemy is trying a combo!",
        "enemy-waiting": "Enemy is thinking...",
    };

    enemyStatusBox.textContent = enemyMessages[phase] || "Enemy is strategizing...";
}

// Wrapper: Updates Player Instruction UI based on game state changes
export function onGameStateChange(newState) {
    updateInstructionText(newState);
}

// Wrapper: Updates Enemy Phase UI based on game state changes
export function onEnemyStateChange(newState) {
    updateEnemyStatus(newState);
}

// Logs battle events to the UI
export function logToResults(message) {
    const logElement = document.getElementById("results-log");
    if (!logElement) return;

    const entry = document.createElement("p");
    entry.textContent = message;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight; // Auto-scroll to the latest message
}
