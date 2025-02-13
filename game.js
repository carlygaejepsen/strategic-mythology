import { 
    loadConfigFiles, 
    loadAllCards, 
    playerDeck, 
    enemyDeck, 
    playerHand, 
    enemyHand, 
    cardTemplates, 
    gameConfig 
} from "./config.js";

import { dealStartingHands, createCardElement, determineCardType } from "./cards.js";
import { battleRound, onGameStateChange, onEnemyStateChange } from "./battle.js";

// 🎮 **Initialize and Start Game**
async function startGame() {
    try {
        console.log("📥 Loading game configuration...");
        await loadConfigFiles();
        await loadAllCards();

        console.log("🎴 Dealing starting hands...");
        dealStartingHands();

        // ✅ Render initial hands
        renderHand(playerHand, "player-hand");
        renderHand(enemyHand, "enemy-hand");

        // ✅ Set game state at launch
        onGameStateChange("start"); // "It's your turn! Select a card to play."
        onEnemyStateChange("enemy-start"); // "Enemy is preparing..."

        console.log("✅ Game successfully started!");
    } catch (error) {
        console.error("❌ ERROR starting game:", error);
    }
}

// 🎴 **Render Hands for Player & Enemy**
function renderHand(hand, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ ERROR: Container '${containerId}' not found.`);
        return;
    }

    container.innerHTML = "";
    hand.forEach(card => {
        container.appendChild(createCardElement(card, determineCardType(card)));
    });
}

// 🎮 **Set Up Event Listeners**
document.addEventListener("DOMContentLoaded", () => {
    startGame();

    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", () => {
            console.log("⚔️ Playing turn...");
            battleRound();

            // ✅ Update hands dynamically after the round
            renderHand(playerHand, "player-hand");
            renderHand(enemyHand, "enemy-hand");
        });
    } else {
        console.error("❌ ERROR: 'Play Turn' button not found!");
    }
});
