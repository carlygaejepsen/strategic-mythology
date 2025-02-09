import { loadConfigFiles } from "./config.js";
import { shuffleDeck, dealStartingHands, playerDeck, enemyDeck } from "./cards.js";
import { battleRound } from "./battle.js";

async function startGame() {
    await loadConfigFiles();
    dealStartingHands();
}

document.addEventListener("DOMContentLoaded", () => {
    startGame();
    document.getElementById("play-turn").addEventListener("click", battleRound);
});
