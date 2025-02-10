import { loadConfigFiles, gameConfig } from "./config.js";
import { loadAllCards, playerDeck, enemyDeck, shuffleDeck, dealStartingHands, playerHand, enemyHand, createCardElement } from "./cards.js"; 
import { battleRound } from "./battle.js"; 


async function startGame() {
    try {
        await loadConfigFiles();
        await loadAllCards();
        dealStartingHands();
        renderHand(playerHand, "player-hand");
        renderHand(enemyHand, "enemy-hand");
        console.log("✅ Game started!");
    } catch (error) {
        console.error("❌ ERROR starting game:", error);
    }
}

function renderHand(hand, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ ERROR: Container '${containerId}' not found.`);
        return;
    }
    container.innerHTML = "";
    hand.forEach(card => container.appendChild(createCardElement(card, card.type)));
}

document.addEventListener("DOMContentLoaded", () => {
    startGame();

    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.addEventListener("click", battleRound);
    } else {
        console.error("❌ ERROR: 'play-turn' button not found!");
    }
});
