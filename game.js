import { loadConfigFiles, gameConfig, loadAllCards } from "./config.js";
import { playerDeck, enemyDeck, shuffleDeck, dealStartingHands, playerHand, enemyHand, createCardElement, handleCardClick, determineCardType } from "./cards.js"; 
import { battleRound } from "./battle.js"; 
import { updateHands } from "./display.js"; // ✅ Ensures consistency in rendering

async function startGame() {
    try {
        await loadConfigFiles();
        await loadAllCards();
        dealStartingHands();
        console.log("✅ Game started!");
    } catch (error) {
        console.error("❌ ERROR starting game:", error);
    }
}

// ✅ Function to render a hand (uses determineCardType for accuracy)
function renderHand(hand, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ ERROR: Container '${containerId}' not found.`);
        return;
    }
    container.innerHTML = "";
    hand.forEach(card => container.appendChild(createCardElement(card, determineCardType(card))));
}

// ✅ Ensure the game starts only after the DOM loads
document.addEventListener("DOMContentLoaded", () => {
    startGame();

    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", battleRound);
    } else {
        console.error("❌ ERROR: 'Play Turn' button not found!");
    }
});
