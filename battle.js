import { processCombat } from "./battle-logic.js";
import { drawCardsToFillHands, setSelectedAttacker, setSelectedDefender, setPlayerHasPlacedCard, setEnemyHasPlacedCard } from "./interact.js";
import { logToResults, getRandomCardFromZone } from "./display.js";

let gameRunning = false;

//gameLoop 3.0
function gameLoop() {
    if (gameRunning) return; // Prevents multiple triggers
    gameRunning = true;

    console.log("🔄 New battle round starting...");

    battleRound(); // ✅ Runs only ONCE per turn

    setTimeout(() => {
        // ✅ Stop looping if a deck is empty
        if (playerDeck.length === 0 || enemyDeck.length === 0) {
            logToResults(playerDeck.length === 0 ? "🏁 Player wins!" : "🏁 Enemy wins!");
            gameRunning = false;
            return;
        }

        // ✅ Ensure the next turn waits for "Play Turn" click
        gameRunning = false;
    }, 1000);
}
//Battle Round 9.0
function battleRound() {
    console.log("⚔️ Battle round begins!");

    // 🚨 Ensure the player has placed a card before starting
    if (!playerHasPlacedCard) {
        console.warn("⚠️ You must place a card in the battle zone before starting a round.");
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

    // 🛑 Remove defeated cards before AI attacks (prevents targeting dead cards)
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

    // 🔄 Reset selections for the next turn
    setSelectedAttacker(null);
    setSelectedDefender(null);
    setPlayerHasPlacedCard(false);
    setEnemyHasPlacedCard(false);

    console.log("✅ Battle round complete. Click 'Play Turn' to continue.");
}

// Event listener
document.addEventListener("DOMContentLoaded", () => {
  const playTurnButton = document.getElementById("play-turn");
  if (playTurnButton) {
    playTurnButton.addEventListener("click", gameLoop);
  }
});

export { battleRound };