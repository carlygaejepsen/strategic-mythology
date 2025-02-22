// interact.js
import { 
    playerHand, enemyHand, gameState, 
    currentPlayerBattleCards, currentEnemyBattleCards 
} from "./config.js";

import { 
    createCardElement, determineCardType 
} from "./cards.js";

import { 
    logToResults, updateInstructionText 
} from "./ui-display.js";

import { 
    enemyPlaceCard, updateHands 
} from "./card-display.js";

import { 
    updatePlayerBattleCard, updateEnemyBattleCard, 
    placeCardInBattleZone, setPlayerHasPlacedCard, 
    setEnemyHasPlacedCard 
} from "./update.js";

import { logDebug, logWarn } from "./utils/logger.js";

export let selectedAttacker = null;
export let selectedDefender = null;
export let selectedCombo = null;

let cardToDiscard = null;

// Debug mode toggle
export const debugMode = false;

/**
 * ✅ Handles all player card clicks (Hand, Battle Zone, Enemy Battle Zone)
 */
export function handleCardClick(card) {
    if (!card || !card.name) {
        logWarn("⚠️ Invalid card click detected.");
        return;
    }

    logDebug(`🃏 DEBUG: Clicked on card: ${card.name}`);
    const type = determineCardType(card);
    
    const inPlayerBattle = Object.values(currentPlayerBattleCards).includes(card);
    const inEnemyBattle = Object.values(currentEnemyBattleCards).includes(card);

    // ✅ Reset player card placement state at the start of each round
    if (!gameState.playerHasPlacedCard && !gameState.enemyHasPlacedCard) {
        logDebug("🔄 New round: Resetting player card placement state.");
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
        updateInstructionText("select-attacker");
        
        // ✅ Enemy places their card immediately after
        enemyPlaceCard();
        return;
    }

    // ✅ Handling Selection of a Player's Battle Card (Attacker or Combo)
    if (inPlayerBattle) {
        if (!selectedAttacker) {
            setSelectedAttacker(card);
            updateInstructionText("select-combo-or-defender");
            logDebug(`⚔️ Attacker selected: ${card.name}`);
            return;
        }

        if (selectedAttacker === card) {
            // Deselect Attacker
            setSelectedAttacker(null);
            updateInstructionText("select-attacker");
            logDebug(`🔄 Attacker deselected.`);
            return;
        }

        // ✅ Selecting a Combo Card
        if (!selectedCombo) {
            setSelectedCombo(card);
            updateInstructionText("select-defender");
            logDebug(`🔥 Combo selected: ${card.name}`);
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
            updateInstructionText("select-defender-or-combo");
            logDebug(`🔄 Defender deselected.`);
            return;
        }

        setSelectedDefender(card);
        updateInstructionText("play-turn");
        logDebug(`🛡️ Defender selected: ${card.name}`);
        return;
    }

    logWarn("⚠️ Invalid selection. Place a card first, then select attacker, combo, and defender.");
}

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
    return cardToDiscard;
}
