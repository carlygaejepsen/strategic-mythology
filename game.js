import { loadConfigFiles } from "./config.js"; // ✅ Load configs
import { loadAllCards, playerDeck, enemyDeck, shuffleDeck, dealStartingHands } from "./cards.js"; // ✅ Import dealStartingHands
import { battleRound } from "./battle.js"; // ✅ Import battle mechanics

async function startGame() {
    await loadConfigFiles(); // Loads game settings
    await loadAllCards(); // Loads all cards

    dealStartingHands(); // ✅ Give player and enemy their initial hands

    console.log("Game started!");
}

// Runs when the page loads
document.addEventListener("DOMContentLoaded", () => {
    startGame();
    document.getElementById("play-turn").addEventListener("click", battleRound);
});
