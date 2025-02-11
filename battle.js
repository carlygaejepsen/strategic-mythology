import { processCombat, battleSystem } from "./battle-logic.js";
import { drawCardsToFillHands, setSelectedAttacker, setSelectedDefender, setPlayerHasPlacedCard, setEnemyHasPlacedCard, selectedAttacker, selectedDefender } from "./interact.js";
import { logToResults, getRandomCardFromZone, removeDefeatedCards } from "./display.js";
import { currentPlayerBattleCards, currentEnemyBattleCards, gameState, playerDeck, enemyDeck } from "./config.js";
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

	// 🔄 Reset selections & allow new cards to be placed
	setSelectedAttacker(null);
	setSelectedDefender(null);
	setPlayerHasPlacedCard(false);  // ✅ This resets at the start of the new round
	setEnemyHasPlacedCard(false);
	console.log("🔄 DEBUG: Reset playerHasPlacedCard & enemyHasPlacedCard for new turn.");


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