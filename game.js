import { loadConfigFiles, gameConfig } from "./config.js"; // ✅ Load configs
import { loadAllCards, playerDeck, enemyDeck, shuffleDeck, dealStartingHands } from "./cards.js"; // ✅ Import deck handling
import { battleRound } from "./battle.js"; // ✅ Import battle mechanics

async function startGame() {
    try {
        await loadConfigFiles(); // ✅ Loads game settings
        await loadAllCards(); // ✅ Loads all cards

        dealStartingHands(); // ✅ Give player and enemy their initial hands

        console.log("✅ Game started!");
    } catch (error) {
        console.error("❌ ERROR starting game:", error);
    }
}

// ✅ Runs when the page loads
document.addEventListener("DOMContentLoaded", () => {
    startGame();

    // ✅ Ensure "play-turn" button exists before adding event listener
    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", battleRound);
    } else {
        console.error("❌ ERROR: 'play-turn' button not found!");
    }
});
