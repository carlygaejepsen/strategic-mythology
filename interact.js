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

// 🎯 **Selection Functions**
export function setSelectedAttacker(card) {
    if (selectedAttacker === card) return; // ✅ Prevent duplicate selection logs
    selectedAttacker = card;
    console.log(`🎯 Selected Attacker: ${card.name}`);
}

export function setSelectedDefender(card) {
    if (selectedDefender === card) return; // ✅ Prevent duplicate selection logs
    selectedDefender = card;
    console.log(`🛡️ Selected Defender: ${card.name}`);
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

// 🎮 **Handle Card Clicks**
export function handleCardClick(card) {
    console.log(`DEBUG: Clicked on card: ${card.name}`);

    const type = determineCardType(card);

    // 🃏 **Placing a card in battle zone**
    if (playerHand.includes(card)) {
        if (!gameState.playerHasPlacedCard) { 
            if (!currentPlayerBattleCards[type] || type === "essence" || type === "ability") {
                placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");

                // ✅ Remove card from hand without reassigning
                playerHand.splice(playerHand.indexOf(card), 1);  
                updateHands();

                setPlayerHasPlacedCard(true);
                enemyPlaceCard();
            } else {
                console.warn(`⚠️ You already have a ${type} card in battle.`);
            }
        } else {
            console.warn("⚠️ You can only place one card per turn.");
        }
        return;
    }

    // 🚫 **Prevent selecting an attacker/defender if battle zone is empty**
    if (!currentPlayerBattleCards[type] && !currentEnemyBattleCards[type]) {
        console.warn("⚠️ No valid card to select.");
        return;
    }

    // 🎯 **Selecting Attacker**
    if (currentPlayerBattleCards[type] === card) {
        setSelectedAttacker(card);
        return;
    }

    // 🛡️ **Selecting Defender**
    if (currentEnemyBattleCards[type] === card) {
        setSelectedDefender(card);
        return;
    }

    console.warn("⚠️ Invalid selection. Place a card first, then select your attacker and defender.");
}
