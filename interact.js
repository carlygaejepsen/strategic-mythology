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
updatePlayerBattleCard, updateEnemyBattleCard 
} from "./update.js";

export let selectedAttacker = null;
export let selectedDefender = null;
export let selectedCombo = null;

export function handleCardClick(card) {
    if (!card || !card.name) {
        console.warn("⚠️ Invalid card click detected.");
        return;
    }
    console.log(`DEBUG: Clicked on card: ${card.name}`);
    const type = determineCardType(card);

    const inPlayerBattle = Object.values(currentPlayerBattleCards).includes(card);
    const inEnemyBattle = Object.values(currentEnemyBattleCards).includes(card);

    if (playerHand.includes(card)) {
        if (gameState.playerHasPlacedCard) {
            console.warn("⚠️ You can only place one card per turn.");
            return;
        }
        placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");
        playerHand.splice(playerHand.indexOf(card), 1);
        updateHands();
        setPlayerHasPlacedCard(true);
        updateInstructionText("select-attacker");
        enemyPlaceCard();
        return;
    }

    if (inPlayerBattle) {
        if (!selectedAttacker) {
            setSelectedAttacker(card);
            updateInstructionText("select-defender-or-combo");
            return;
        }
        if (selectedAttacker === card) {
            setSelectedAttacker(null);
            updateInstructionText("select-attacker");
            return;
        }
        setSelectedCombo(card);
        updateInstructionText("select-defender");
        return;
    }

    if (inEnemyBattle) {
        if (selectedDefender === card) {
            setSelectedDefender(null);
            updateInstructionText("select-defender-or-combo");
            return;
        }
        setSelectedDefender(card);
        updateInstructionText("play-turn");
        return;
    }

    console.warn("⚠️ Invalid selection. Place a card first, then select attacker, combo, and defender.");
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

export function setPlayerHasPlacedCard(value) {
    gameState.playerHasPlacedCard = value;
}

export function setEnemyHasPlacedCard(value) {
    gameState.enemyHasPlacedCard = value;
}

export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
    console.log(`DEBUG: Attempting to place ${card.name} in ${battleZoneId}`);
    const battleZone = document.getElementById(battleZoneId);
    if (!battleZone) return;
    
    battleZone.innerHTML = "";
    const type = determineCardType(card);
    if (!["char", "essence", "ability"].includes(type)) {
        console.error(`🚨 ERROR: Invalid card type '${type}' for ${card.name}!`);
        return;
    }
    const cardElement = createCardElement(card, type);
    battleZone.appendChild(cardElement);
    updateFunction(card, type);
    
    if (owner === "Player") {
        currentPlayerBattleCards[type] = card;
    } else {
        currentEnemyBattleCards[type] = card;
    }
    console.log(`🔄 ${owner} placed a ${type} card: ${card.name}`);
    return cardElement;
}
