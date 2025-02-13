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
    logToResults, updateHands 
} from "./display.js";

import { onGameStateChange, onEnemyStateChange } from "./battle.js"; // ✅ Ensure state updates work

export let selectedAttacker = null;
export let selectedDefender = null;

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

// 🎯 **Selection Functions 2.0
export function setSelectedAttacker(card) {
    selectedAttacker = card;
    if (card) {
        console.log(`🎯 Selected Attacker: ${card.name}`);
    } else {
        console.log("🎯 Selected Attacker reset.");
    }
}

export function setSelectedDefender(card) {
    selectedDefender = card;
    if (card) {
        console.log(`🛡️ Selected Defender: ${card.name}`);
    } else {
        console.log("🛡️ Selected Defender reset.");
    }
}

export function setPlayerHasPlacedCard(value) {
    gameState.playerHasPlacedCard = value;

    // ✅ Update player instruction when both players have placed a card
    if (gameState.playerHasPlacedCard && gameState.enemyHasPlacedCard) {
        onGameStateChange("select-attacker");
    }
}

export function setEnemyHasPlacedCard(value) {
    gameState.enemyHasPlacedCard = value;

    // ✅ Update enemy status correctly
    if (typeof onEnemyStateChange === "function") {
        onEnemyStateChange("enemy-select-attacker");
    } else {
        console.error("🚨 ERROR: onEnemyStateChange is not defined!");
    }
}
// 🃏 **Place a Card in Battle Zone**
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

// 🎮 **Handle Card Clicks 2.0
export function handleCardClick(card) {
    if (!card?.name) {
        console.warn("⚠️ Invalid card click detected.");
        return;
    }

    console.log(`🎴 Clicked on card: ${card.name}`);
    const type = determineCardType(card);

    // 🃏 **Placing a Card in Battle Zone**
    if (playerHand.includes(card)) {
        if (gameState.playerHasPlacedCard) {
            console.warn("⚠️ You can only place one card per turn.");
            return;
        }

        // ✅ Check if slot is available for card type
        const canPlaceCard = !currentPlayerBattleCards[type] || ["essence", "ability"].includes(type);
        if (canPlaceCard) {
            placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");

            // ✅ Remove placed card from hand using `splice()` (mutation-friendly)
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
    const hasBattleCards = Object.values(currentPlayerBattleCards).some(c => c) || 
                           Object.values(currentEnemyBattleCards).some(c => c);

    if (!hasBattleCards) {
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
        console.log(`✅ Selected Attacker: ${card.name}`);
        return;
    }

    // 🛡️ **Selecting a Defender**
    if (currentEnemyBattleCards[type] === card) {
        if (selectedDefender === card) {
            console.warn("⚠️ This card is already selected as the defender.");
            return;
        }
        setSelectedDefender(card);
        console.log(`✅ Selected Defender: ${card.name}`);
        return;
    }

    console.warn("⚠️ Invalid selection. Place a card first, then select your attacker and defender.");
}
