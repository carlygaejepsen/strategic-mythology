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
    updateInstructionText 
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

// 🎮 **Main Game Loop 2.2**
function gameLoop() {
    if (gameRunning) return; // Prevent multiple triggers
    gameRunning = true;

    console.log("🔄 New battle round starting...");

    // 🚨 Ensure both players have placed a card before continuing
    if (!gameState.playerHasPlacedCard || !gameState.enemyHasPlacedCard) {
        console.warn("⚠️ Both players must place a card before starting the round.");
        gameRunning = false; // ✅ Prevent soft locks
        return;
    }

    // ✅ Update UI: Change status bars to reflect attack phase
    onGameStateChange("select-attacker");
    onEnemyStateChange("enemy-select-attacker");

    battleRound();
}

// ⚔️ **Battle Round 2.2**
function battleRound() {
    console.log("⚔️ Battle round begins!");

    // 🚨 Ensure the player has placed a card before starting
    if (!gameState.playerHasPlacedCard) {
        console.warn("⚠️ Player must place a card before the battle round can continue.");
        return;
    }

    // 🚨 Ensure the player has selected an attacker and defender before continuing
    if (!selectedAttacker || !selectedDefender) {
        console.warn("⚠️ Select an attacker and an enemy defender before continuing.");
        return;
    }

    // ⚔️ Player's Attack
    console.log(`🎯 ${selectedAttacker.name} attacks ${selectedDefender.name}`);
    processCombat(selectedAttacker, selectedDefender);

    // 🛑 Remove defeated cards before AI attacks
    removeDefeatedCards();

    // 🤖 Enemy AI Attack (Random selection)
    const enemyAttacker = getRandomCardFromZone(currentEnemyBattleCards);
    const playerDefender = getRandomCardFromZone(currentPlayerBattleCards);

    if (enemyAttacker && playerDefender) {
        console.log(`🤖 Enemy AI: ${enemyAttacker.name} attacks ${playerDefender.name}`);
        processCombat(enemyAttacker, playerDefender);
    } else {
        console.log("🤖 Enemy AI has no valid attack this turn.");
    }

    // 🛑 Remove defeated cards again after AI attack
    removeDefeatedCards();

    // ✅ Ensure the instruction box resets **after** defeated cards are removed
    onGameStateChange("start");
    onEnemyStateChange("enemy-start");

    // 🃏 Draw one new card per hand (not battle zone)
    drawCardsToFillHands();

    // 🔄 Reset selections **after** UI updates are complete
    setTimeout(resetSelections, 500); // ✅ Ensures smooth transition

    console.log("✅ Battle round complete. Click 'Play Turn' to continue.");
}

// 🔄 **Reset Selections & Card Placement**
export function resetSelections() {
    setSelectedAttacker(null);
    setSelectedDefender(null);
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

// 🎮 **Initialize turn states**
onGameStateChange("start");
onEnemyStateChange("enemy-start");

// 🎮 **Add event listener for "Play Turn" button**
document.addEventListener("DOMContentLoaded", () => {
    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", gameLoop);
    }
});

export { battleRound };
