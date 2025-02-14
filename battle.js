import { processCombat } from "./battle-logic.js";
import { 
    drawCardsToFillHands, 
    setSelectedAttacker, 
    setSelectedDefender, 
    setPlayerHasPlacedCard, 
    setEnemyHasPlacedCard, 
    selectedAttacker, 
    selectedDefender 
} from "./interact.js";
import { 
    logToResults, 
    getRandomCardFromZone, 
    removeDefeatedCards, 
    updateInstructionText, 
    updateEnemyStatus 
} from "./display.js";
import { 
    currentPlayerBattleCards, 
    currentEnemyBattleCards, 
    gameState, 
    playerDeck, 
    enemyDeck, 
    playerHand, 
    enemyHand 
} from "./config.js";
import { determineCardType } from "./cards.js";

let gameRunning = false;
let selectedCombo = null; // 🔥 NEW: Tracks if a combo is selected

// 🎮 **Main Game Loop**
function gameLoop() {
    if (gameRunning) return; // Prevent multiple triggers
    gameRunning = true;

    console.log("🔄 New battle round starting...");

    // 🚨 Ensure both players have placed a card before continuing
    if (!gameState.playerHasPlacedCard || !gameState.enemyHasPlacedCard) {
        console.warn("⚠️ Both players must place a card before starting the round.");
        updateInstructionText("select-battle-card");
        updateEnemyStatus("enemy-select-battle-card"); // 🔥 Ensure enemy UI updates correctly
        gameRunning = false;
        return;
    }

    updateInstructionText("select-attacker");
    updateEnemyStatus("enemy-select-attacker"); // ✅ Ensure enemy UI updates properly
}

// 🔄 **Handles Player Selecting an Attacker**
export function handleSelectAttacker(card) {
    if (!card) return;
    setSelectedAttacker(card);
    console.log(`✅ Attacker selected: ${card.name}`);

    // ✅ Check if a combo is available
    if (playerHasComboOption()) {
        updateInstructionText("select-combo");
        updateEnemyStatus("enemy-combo"); // ✅ Enemy UI update for combo
    } else {
        updateInstructionText("select-defender");
        updateEnemyStatus("enemy-select-defender"); // ✅ Enemy UI update for defender selection
    }
}

// 🔄 **Handles Player Selecting a Combo**
export function handleSelectCombo(combo) {
    if (!combo) return;
    selectedCombo = combo;
    console.log(`🔥 Combo selected: ${combo.name}`);

    updateInstructionText("select-defender");
    updateEnemyStatus("enemy-select-defender");
}

// 🔄 **Handles Player Selecting a Defender**
export function handleSelectDefender(card) {
    if (!card) return;
    setSelectedDefender(card);
    console.log(`✅ Defender selected: ${card.name}`);

    updateInstructionText("play-turn");
    updateEnemyStatus("enemy-waiting");
}

// ⚔️ **Battle Round**
function battleRound() {
    console.log("⚔️ Battle round begins!");

    if (!selectedAttacker || !selectedDefender) {
        console.warn("⚠️ Select an attacker and an enemy defender before continuing.");
        return;
    }

    updateInstructionText("battling");
    updateEnemyStatus("enemy-battling");

    if (selectedCombo) {
        console.log(`🔥 ${selectedAttacker.name} uses ${selectedCombo.name} while attacking ${selectedDefender.name}`);
        processCombat(selectedAttacker, selectedDefender, selectedCombo);
    } else {
        console.log(`🎯 ${selectedAttacker.name} attacks ${selectedDefender.name}`);
        processCombat(selectedAttacker, selectedDefender);
    }

    removeDefeatedCards();

    const enemyAttacker = getRandomCardFromZone(currentEnemyBattleCards);
    const playerDefender = getRandomCardFromZone(currentPlayerBattleCards);

    if (enemyAttacker && playerDefender) {
        console.log(`🤖 Enemy AI: ${enemyAttacker.name} attacks ${playerDefender.name}`);
        processCombat(enemyAttacker, playerDefender);
    } else {
        console.log("🤖 Enemy AI has no valid attack this turn.");
    }

    removeDefeatedCards();

    updateInstructionText("select-battle-card");
    updateEnemyStatus("enemy-start");

    drawCardsToFillHands();

    setTimeout(resetSelections, 500);
    console.log("✅ Battle round complete. Click 'Play Turn' to continue.");
}

// 🔄 **Reset Selections & Card Placement**
export function resetSelections() {
    setSelectedAttacker(null);
    setSelectedDefender(null);
    selectedCombo = null;
    setPlayerHasPlacedCard(false);
    setEnemyHasPlacedCard(false);
    console.log("🔄 Reset playerHasPlacedCard & enemyHasPlacedCard for new turn.");
}

// 🛡️ **Update Enemy Status UI**
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

// 📝 **Update Player Instruction UI**
export function onGameStateChange(newState) {
    updateInstructionText(newState);
}

// 🔄 **Update Enemy Phase UI**
export function onEnemyStateChange(newState) {
    updateEnemyStatus(newState);
}

// 🎮 **Initialize Turn States**
document.addEventListener("DOMContentLoaded", () => {
    console.log("🎮 Initializing game states...");
    updateInstructionText("select-battle-card");
    updateEnemyStatus("enemy-start");

    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", battleRound);
    }
});

export { battleRound, handleSelectAttacker, handleSelectDefender, handleSelectCombo };
