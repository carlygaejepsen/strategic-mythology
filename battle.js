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
    removeDefeatedCards 
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

//Main Game Loop 2.0
function gameLoop() {
    if (gameRunning) return; // Prevent multiple triggers
    gameRunning = true;

    console.log("🔄 New battle round starting...");

    // 🚨 Check if both players have placed a card before moving forward
    if (!gameState.playerHasPlacedCard || !gameState.enemyHasPlacedCard) {
        console.warn("⚠️ Both players must place a card before starting the round.");
        return;
    }

    // ✅ Update player and enemy status for the attack phase
    onGameStateChange("select-attacker");
    onEnemyStateChange("enemy-select-attacker");

    battleRound(); // Runs only once per turn

    setTimeout(() => {
        if (playerDeck.length === 0 || enemyDeck.length === 0) {
            logToResults(playerDeck.length === 0 ? "🏁 Player wins!" : "🏁 Enemy wins!");
            gameRunning = false;
            return;
        }

        gameRunning = false;
    }, 1000);
}

/**
 * ⚔️ Handles a single battle round.
 */
function battleRound() {
    console.log("⚔️ Battle round begins!");

    // 🚨 Ensure the player has placed a card before starting
    if (!gameState.playerHasPlacedCard) {
        const canPlay = playerHand.some(card => !currentPlayerBattleCards[determineCardType(card)]);
        if (!canPlay) {
            console.warn("⚠️ No valid cards to play. Skipping placement...");
        } else {
            console.warn("⚠️ You must place a card in the battle zone before starting a round.");
            return;
        }
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

    // 🃏 Draw one new card per hand (not battle zone)
    drawCardsToFillHands();

    // 🔄 Reset selections & allow new cards to be placed
    resetSelections();

    console.log("✅ Battle round complete. Click 'Play Turn' to continue.");
}

/**
 * 🔄 Resets player and enemy selections after each turn.
 */
function resetSelections() {
    setSelectedAttacker(null);
    setSelectedDefender(null);
    setPlayerHasPlacedCard(false);
    setEnemyHasPlacedCard(false);
    console.log("🔄 Reset playerHasPlacedCard & enemyHasPlacedCard for new turn.");
}

/**
 * 📜 Updates the instruction box for the player.
 */
function updateInstructionText(phase) {
    const instructionBox = document.getElementById("instruction-box");
    if (!instructionBox) return;

    const instructionMessages = {
        "start": "It's your turn! Select a card to play.",
        "select-battle-card": "Choose a card to send to the battle zone.",
        "select-attacker": "Select your attacker.",
        "select-defender": "Choose which enemy to attack.",
        "combo": "Try combining abilities!",
        "waiting": "Waiting for opponent...",
    };

    instructionBox.textContent = instructionMessages[phase] || "Make your move!";
}

/**
 * 🚦 Updates the enemy's status during their turn.
 */
function updateEnemyStatus(phase) {
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

/**
 * 🎭 Handles game state changes for the player.
 */
function onGameStateChange(newState) {
    updateInstructionText(newState);
}

/**
 * 🤖 Handles game state changes for the enemy.
 */
function onEnemyStateChange(newState) {
    updateEnemyStatus(newState);
}

// Example: Initialize turn states
onGameStateChange("start");
onEnemyStateChange("enemy-start");

// 🎮 Add event listener for the "Play Turn" button
document.addEventListener("DOMContentLoaded", () => {
    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", gameLoop);
    }
});

export { battleRound };
