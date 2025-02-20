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
    updatePlayerBattleCard, updateEnemyBattleCard, placeCardInBattleZone, setPlayerHasPlacedCard, setEnemyHasPlacedCard 
} from "./update.js";

import { logDebug, logWarn } from "./utils/logger.js";

export let selectedAttacker = null;
export let selectedDefender = null;
export let selectedCombo = null;

let cardToDiscard = null;

// Debug mode toggle
export const debugMode = false;

//Card Click 5.0
export function handleCardClick(card) {
    if (!card || !card.name) {
        logWarn("⚠️ Invalid card click detected.");
        return;
    }

    logDebug(`🃏 DEBUG: Clicked on card: ${card.name}`);
    const type = determineCardType(card);
    
    const inPlayerBattle = Object.values(currentPlayerBattleCards).includes(card);
    const inEnemyBattle = Object.values(currentEnemyBattleCards).includes(card);

    // Mark card for discarding
    if (cardToDiscard === card) {
        cardToDiscard = null;
        logDebug(`🔄 Card deselected for discarding: ${card.name}`);
    } else {
        cardToDiscard = card;
        logDebug(`🗑️ Card selected for discarding: ${card.name}`);
    }

    // ✅ Handling Player Selecting a Card from Hand
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
        setPlayerHasPlacedCard(true);
        updateInstructionText("select-attacker");
        enemyPlaceCard(); // Let the enemy place their card
        setPlayerHasPlacedCard(false); // Reset player card placement state for the next turn

        return;
    }

    // ✅ Handling Selection of a Player's Battle Card
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

export function setSelectedAttacker(card) {
    selectedAttacker = card;
}

export function setSelectedDefender(card) {
    selectedDefender = card;
}

export function setSelectedCombo(card) {
    selectedCombo = card;
}

export function selectCardToDiscard() {
    return cardToDiscard;
}