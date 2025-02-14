import { 
    playerHand, enemyHand, gameState, 
    currentPlayerBattleCards, currentEnemyBattleCards, 
    playerDeck, enemyDeck 
} from "./config.js";

import { 
    createCardElement, determineCardType 
} from "./cards.js";

import { 
    updatePlayerBattleCard, enemyPlaceCard, 
    logToResults, updateHands, updateInstructionText 
} from "./display.js";

import { onGameStateChange, onEnemyStateChange } from "./battle.js"; 

export let selectedAttacker = null;
export let selectedDefender = null;
export let selectedCombo = null; // 🔥 New: Supports combos

// 🎴 **Draw Cards to Fill Hands**
export function drawCardsToFillHands() {
    console.log("DEBUG: Drawing cards - Player Hand:", playerHand, "Enemy Hand:", enemyHand);
  
    if (playerHand.length < 6 && playerDeck.length > 0) {
        const drawn = playerDeck.shift();
        playerHand.push(drawn);
        logToResults(`🃏 Player draws ${drawn.name}`);
    }

    if (enemyHand.length < 6 && enemyDeck.length > 0) {
        const drawn = enemyDeck.shift();
        enemyHand.push(drawn);
        logToResults(`🃏 Enemy draws ${drawn.name}`);
    }
    
    updateHands();
}

// 🎯 **Selection Functions**
export function setSelectedAttacker(card) {
    if (!card) return;
    selectedAttacker = card;
    console.log(`🎯 Selected Attacker: ${card.name}`);
    checkComboAvailability(); // 🔥 New: Check if combos are available
}

export function setSelectedDefender(card) {
    if (!card) return;
    selectedDefender = card;
    console.log(`🛡️ Selected Defender: ${card.name}`);
    updateInstructionText("play-turn");
}

export function setSelectedCombo(combo) {
    if (!combo) return;
    selectedCombo = combo;
    console.log(`🔥 Combo selected: ${combo.name}`);
    updateInstructionText("select-defender");
}

// 🃏 **Check If Player Can Use a Combo**
function checkComboAvailability() {
    if (playerHasComboOption()) {
        updateInstructionText("select-combo");
    } else {
        updateInstructionText("select-defender");
    }
}

// ✅ **Sets whether the player has placed a card**
export function setPlayerHasPlacedCard(value) {
    gameState.playerHasPlacedCard = value;

    if (gameState.playerHasPlacedCard && gameState.enemyHasPlacedCard) {
        onGameStateChange("select-attacker");
    }
}

// ✅ **Sets whether the enemy has placed a card**
export function setEnemyHasPlacedCard(value) {
    gameState.enemyHasPlacedCard = value;

    if (typeof onEnemyStateChange === "function") {
        onEnemyStateChange("enemy-select-attacker");
    } else {
        console.error("🚨 ERROR: onEnemyStateChange is not defined!");
    }
}

// 🃏 **Place a Card in the Battle Zone**
export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
    console.log(`DEBUG: Attempting to place ${card.name} in ${battleZoneId}`);

    const battleZone = document.getElementById(battleZoneId);
    if (!battleZone) return;

    battleZone.innerHTML = ""; // ✅ Clear previous card
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

// 🎮 **Handle Card Clicks 3.0 (Now Supports Combos)**
export function handleCardClick(card) {
    if (!card || !card.name) {
        console.warn("⚠️ Invalid card click detected.");
        return;
    }

    console.log(`DEBUG: Clicked on card: ${card.name}`);
    const type = determineCardType(card);

    // 🃏 **Placing a Card in Battle Zone**
    if (playerHand.includes(card)) {
        if (gameState.playerHasPlacedCard) {
            console.warn("⚠️ You can only place one card per turn.");
            return;
        }

        if (!currentPlayerBattleCards[type] || type === "essence" || type === "ability") {
            placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");

            const index = playerHand.indexOf(card);
            if (index !== -1) playerHand.splice(index, 1);

            updateHands();
            setPlayerHasPlacedCard(true);
            enemyPlaceCard();
        } else {
            console.warn(`⚠️ You already have a ${type} card in battle.`);
        }
        return;
    }

    // 🚫 **Prevent selecting an attacker/defender if no valid battle cards exist**
    if (!Object.values(currentPlayerBattleCards).some(c => c) && !Object.values(currentEnemyBattleCards).some(c => c)) {
        console.warn("⚠️ No valid cards in the battle zone to select.");
        return;
    }

    // 🎯 **Selecting an Attacker**
    if (currentPlayerBattleCards[type] === card) {
        if (selectedAttacker === card) {
            console.warn("⚠️ This card is already selected as the attacker.");
            return;
        }
        setSelectedAttacker(card);
        return;
    }

    // 🔥 **Selecting a Combo (If Available)**
    if (selectedAttacker && isComboCard(card)) {
        if (selectedCombo === card) {
            console.warn("⚠️ This combo is already selected.");
            return;
        }
        setSelectedCombo(card);
        return;
    }

    // 🛡️ **Selecting a Defender**
    if (currentEnemyBattleCards[type] === card) {
        if (selectedDefender === card) {
            console.warn("⚠️ This card is already selected as the defender.");
            return;
        }
        setSelectedDefender(card);
        return;
    }

    console.warn("⚠️ Invalid selection. Place a card first, then select your attacker, combo, and defender.");
}

// 🃏 **Check If a Card is a Combo Card**
function isComboCard(card) {
    return card.type === "ability" && selectedAttacker;
}

// 🔄 **Resets Turn Selections**
export function resetTurnSelections() {
    selectedAttacker = null;
    selectedDefender = null;
    selectedCombo = null;
    console.log("🔄 Selections reset.");
}
