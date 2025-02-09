import { loadConfigFiles } from "./config.js"; // ✅ Load configs at game start
import { loadAllCards, playerDeck, enemyDeck, shuffleDeck } from "./cards.js"; // ✅ Manage decks
import { battleRound } from "./battle.js"; // ✅ Handle battle rounds

async function startGame() {
    await loadConfigFiles();
    dealStartingHands();
}

document.addEventListener("DOMContentLoaded", () => {
    startGame();
    document.getElementById("play-turn").addEventListener("click", battleRound);
});
