import {
    playerHand, enemyHand, gameState, debugMode,
    currentPlayerBattleCards, currentEnemyBattleCards,
    turnPhases, setCurrentPhase
} from "./config.js";

import {
    createCardElement, determineCardType
} from "./cards.js";

import {
    logToResults
} from "./ui-display.js";

import {
    updatePlayerBattleCard, updateEnemyBattleCard,
    placeCardInBattleZone, setPlayerHasPlacedCard,
    setEnemyHasPlacedCard, enemyPlaceCard
} from "./update.js";
import { updateHands } from "./card-display.js";
import { updateDeckCounts } from "./ui-display.js";

import { logDebug, logWarn, logError } from "./utils/logger.js";

export let selectedAttacker = null;
export let selectedDefender = null;
export let selectedCombo = null;

// We'll keep a reference for discarding, if needed.
let lastClickedCard = null;

/**
 * ✅ Sets the selected attacker.
 */
export function setSelectedAttacker(card) {
    selectedAttacker = card;
}

/**
 * ✅ Sets the selected defender.
 */
export function setSelectedDefender(card) {
    selectedDefender = card;
}

/**
 * ✅ Sets the selected combo card.
 */
export function setSelectedCombo(card) {
    selectedCombo = card;
}

/**
 * ✅ Selects a card for discarding.
 */
export function selectCardToDiscard() {
    return lastClickedCard;
}

/**
 * ✅ Logic to discard a specific card back to the deck.
 */
export function discardCard(card) {
    if (!card) {
        logWarn("🗑️ No card selected to discard.");
        return;
    }

    const type = determineCardType(card);

    // Remove card from player's hand
    const handIndex = playerHand.indexOf(card);
    if (handIndex !== -1) {
        playerHand.splice(handIndex, 1);
        playerDeck.push(card); // Add card back to the deck
        logDebug(`🗑️ Discarded ${card.name} from hand.`);
        updateHands();
        updateDeckCounts(playerDeck.length, enemyDeck.length);
        lastClickedCard = null;
        return;
    }

    // Remove card from player's battle zone
    if (currentPlayerBattleCards[type] === card) {
        currentPlayerBattleCards[type] = null;
        const battleZone = document.getElementById(`player-${type}-zone`);
        if (battleZone) {
            battleZone.innerHTML = "";
        }
        playerDeck.push(card); // Add card back to the deck
        logDebug(`🗑️ Discarded ${card.name} from battle zone.`);
        updateDeckCounts(playerDeck.length, enemyDeck.length);
        lastClickedCard = null;
        return;
    }

    logError("❌ ERROR: Card not found in hand or battle zone.");
}

/**
 * ✅ Handles all player card clicks (Hand, Battle Zone, Enemy Battle Zone)
 */
export function handleCardClick(card) {
    if (!card || !card.name) {
        logWarn("⚠️ Invalid card click detected.");
        return;
    }

    lastClickedCard = card;

    if (debugMode) {
      logDebug(`🃏 DEBUG: Clicked on card: ${card.name}`);
    }
    const type = determineCardType(card);

    const inPlayerBattle = Object.values(currentPlayerBattleCards).includes(card);
    const inEnemyBattle = Object.values(currentEnemyBattleCards).includes(card);

    // ✅ Reset player card placement state at the start of each round
    if (!gameState.playerHasPlacedCard && !gameState.enemyHasPlacedCard) {
        if (debugMode) {
          logDebug("🔄 New round: Resetting player card placement state.");
        }
        setPlayerHasPlacedCard(false);
    }

    // ✅ Handling Player Selecting a Card from Hand to Place in Battle
    if (playerHand.includes(card)) {
        if (gameState.playerHasPlacedCard) {
            logWarn("⚠️ You can only place one card per turn.");
            return;
        }

        if (currentPlayerBattleCards[type]) {
            logWarn(`⚠️ You already have a ${type} card in the battle zone.`);
            return;
        }

        placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");
        playerHand.splice(playerHand.indexOf(card), 1);
        updateHands();
        setPlayerHasPlacedCard(true); // ✅ Prevent placing another card this turn
        setCurrentPhase(turnPhases.SELECT_ATTACKER);

        // ✅ Enemy places their card immediately after
        enemyPlaceCard();
        return;
    }

    // ✅ Handling Selection of a Player's Battle Card (Attacker or Combo)
    if (inPlayerBattle) {
        if (!selectedAttacker) {
            setSelectedAttacker(card);
            setCurrentPhase(turnPhases.SELECT_DEFENDER_OR_COMBO);
            if (debugMode) {
              logDebug(`⚔️ Attacker selected: ${card.name}`);
            }
            return;
        }

        if (selectedAttacker === card) {
            // Deselect Attacker
            setSelectedAttacker(null);
            setCurrentPhase(turnPhases.SELECT_ATTACKER);
            if (debugMode) {
              logDebug(`🔄 Attacker deselected.`);
            }
            return;
        }

        // ✅ Selecting a Combo Card
        if (!selectedCombo) {
            setSelectedCombo(card);
            setCurrentPhase(turnPhases.SELECT_DEFENDER);
            if (debugMode) {
              logDebug(`🔥 Combo selected: ${card.name}`);
            }
            return;
        }

        logWarn("⚠️ You already selected a combo. Select a defender now.");
        return;
    }

    // ✅ Handling Selection of an Enemy's Battle Card (Defender)
    if (inEnemyBattle) {
        if (!selectedAttacker) {
            logWarn("⚠️ Select an attacker first.");
            return;
        }

        if (selectedDefender === card) {
            // Deselect Defender
            setSelectedDefender(null);
            setCurrentPhase(turnPhases.SELECT_DEFENDER_OR_COMBO);
            if (debugMode) {
              logDebug(`🔄 Defender deselected.`);
            }
            return;
        }

        setSelectedDefender(card);
        setCurrentPhase(turnPhases.PLAY_TURN);
        if (debugMode) {
          logDebug(`🛡️ Defender selected: ${card.name}`);
        }
        return;
    }

    logWarn("⚠️ Invalid selection. Place a card first, then select attacker, combo, and defender.");
}

// ✅ Deck Click Listener Initialization
document.addEventListener("DOMContentLoaded", () => {
    const playerDeckElement = document.getElementById("player-deck");
    const enemyDeckElement = document.getElementById("enemy-deck");

    if (playerDeckElement) {
        playerDeckElement.addEventListener("click", () => {
            logDebug("🗑️ Attempting to discard last clicked card to Player Deck...");
            discardCard(lastClickedCard);
        });
    }

    if (enemyDeckElement) {
        enemyDeckElement.addEventListener("click", () => {
            logWarn("⚠️ You cannot discard cards to the enemy deck!");
        });
    }
});
