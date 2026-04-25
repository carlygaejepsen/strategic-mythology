console.log("battle.js loaded");
import { processCombat, checkForTripleCombo, performTripleCombo, processDirectAttack, checkWinCondition } from "./battle-logic.js";
import {
    selectedAttacker,
    selectedDefender,
    selectedCombo
} from "./interact.js";

// We import debugMode (and setDebugMode) from config, so there's no local definition.
// ensures we’re always using the same debugMode that is defined in config.js.

import {
    playerHand, enemyHand, playerDeck, enemyDeck, gameState, debugMode, setDebugMode, currentEnemyBattleCards, currentPlayerBattleCards, turnPhases, setCurrentPhase
} from "./config.js";

import {
    logToResults, updateInstructionText, updateEnemyStatus, updateDeckCounts
} from "./ui-display.js";

import {
    updateHands, removeDefeatedCards, getRandomCardFromZone
} from "./card-display.js";

import {
    resetSelections, enemyPlaceCard, placeCardInBattleZone, setPlayerHasPlacedCard, setEnemyHasPlacedCard, updatePlayerBattleCard, updateEnemyBattleCard, drawCardsForPlayer,
    drawCardsForEnemy, getEnemyOpenSlots
} from "./update.js";

import { logDebug, logError, logWarn } from "./utils/logger.js";

// We'll use a local variable to track if the game is running.
let turnInProgress = false;

// 🎮 **Start Game** - Ensures game initializes correctly
export function startGame() {
    drawCardsToFillHands();
    updateInstructionText(turnPhases.SELECT_BATTLE_CARD);
    updateEnemyStatus("enemy-start");
    if (debugMode) {
      logDebug("✅ Game started!");
    }
}

// Draw Cards to Fill Hands 2.0
export function drawCardsToFillHands() {
  if (debugMode) {
    logDebug(`DEBUG: Drawing cards - Player Hand: ${JSON.stringify(playerHand)}`);
    logDebug(`DEBUG: Drawing cards - Enemy Hand: ${JSON.stringify(enemyHand)}`);
  }
  drawCardsForPlayer();
  drawCardsForEnemy();
  updateDeckCounts(playerDeck.length, enemyDeck.length);
}

// 🎮 **Manages an entire turn**
export function manageTurn() {
    if (turnInProgress) return;
    turnInProgress = true;

    if (debugMode) {
      logDebug("🔄 Starting turn management.");
    }

    // ✅ Enemy attempts to play a card before attacking
    enemyPlaceCard().then(() => {
        if (!gameState.playerHasPlacedCard || !gameState.enemyHasPlacedCard) {
            turnInProgress = false;
            return;
        }

        battleRound();

        if (playerDeck.length === 0 && enemyDeck.length === 0) {
            logToResults("🏁 It's a draw!");
            turnInProgress = false;
            return;
        }

        setTimeout(() => {
            resetSelections().then(() => {
                drawCardsToFillHands().then(() => {
                    updateInstructionText(turnPhases.SELECT_BATTLE_CARD);
                    // Reset the flags for the next turn
                    gameState.playerHasPlacedCard = false;
                    gameState.enemyHasPlacedCard = false;
                    turnInProgress = false;
                    if (debugMode) {
                      logDebug("🔄 Turn management completed.");
                    }
                });
            });
        }, 1000);
    }).catch(error => {
        logError(`❌ Error during enemyPlaceCard: ${error}`);
        turnInProgress = false;
    });
}

// ⚔️ **Handles the battle round**
export function battleRound() {
    let battleProceeded = false;

    if (checkForTripleCombo(currentPlayerBattleCards, "Player")) {
        performTripleCombo("Player", currentEnemyBattleCards);
        battleProceeded = true;
    } else if (selectedAttacker) {
        if (selectedDefender) {
            if (selectedCombo) {
                logToResults(`🔥 ${selectedAttacker.name} uses ${selectedCombo.name} while attacking ${selectedDefender.name}`);
                processCombat(selectedAttacker, selectedDefender, true);
            } else {
                logToResults(`⚔️ ${selectedAttacker.name} attacks ${selectedDefender.name}`);
                processCombat(selectedAttacker, selectedDefender);
            }
        } else {
            // Check if enemy has NO cards at all in battle zone
            const enemyCards = Object.values(currentEnemyBattleCards).filter(c => c);
            if (enemyCards.length === 0) {
                processDirectAttack(selectedAttacker, "Enemy");
            } else {
                logWarn("⚠️ Select a defender or a direct attack is not possible while enemy has cards.");
                turnInProgress = false;
                return;
            }
        }
        battleProceeded = true;
    } else {
        logWarn("⚠️ Select an attacker before continuing.");
        turnInProgress = false;
        return;
    }

    if (battleProceeded) {
        removeDefeatedCards();
        if (checkWinCondition()) {
            turnInProgress = false;
            return;
        }
        setTimeout(() => {
            enemyTurn();
        }, 500);
    }
}

// 🤖 **Enemy AI Turn**
function enemyTurn() {
    if (checkForTripleCombo(currentEnemyBattleCards, "Enemy")) {
        performTripleCombo("Enemy", currentPlayerBattleCards);
    } else {
        const enemyAttacker = getRandomCardFromZone(currentEnemyBattleCards);
        const playerDefender = getRandomCardFromZone(currentPlayerBattleCards);
        
        if (enemyAttacker) {
            if (playerDefender) {
                logToResults(`🤖 Enemy AI: ${enemyAttacker.name} attacks ${playerDefender.name}`);
                processCombat(enemyAttacker, playerDefender);
            } else {
                // Direct attack player
                processDirectAttack(enemyAttacker, "Player");
            }
        } else {
            logToResults("🤖 Enemy AI has no cards to attack with.");
        }
    }

    removeDefeatedCards();
    
    if (checkWinCondition()) {
        turnInProgress = false;
        return;
    }

    setTimeout(() => {
        resetSelections();
        setCurrentPhase(turnPhases.DISCARD_TO_DECK);
        updateInstructionText(turnPhases.DISCARD_TO_DECK);
    }, 500);
}
