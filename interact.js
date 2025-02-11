import { playerHand, enemyHand, gameState, currentPlayerBattleCards, currentEnemyBattleCards, playerDeck, enemyDeck } from "./config.js";
import { createCardElement, determineCardType } from "./cards.js";
import { updatePlayerBattleCard, enemyPlaceCard, removeDefeatedCards, logToResults, updateHands } from "./display.js";

export let selectedAttacker = null;
export let selectedDefender = null;

export function drawCardsToFillHands() {
    console.log("DEBUG: Drawing cards - Player Hand:", playerHand, "Enemy Hand:", enemyHand);
  
    // Player draw
    if (playerHand.length < 6 && playerDeck.length > 0) {
        const drawn = playerDeck.shift();
        playerHand.push(drawn);
        logToResults(`🃏 Player draws ${drawn.name}`);
    }

    // Enemy draw
    if (enemyHand.length < 6 && enemyDeck.length > 0) {
        const drawn = enemyDeck.shift();
        enemyHand.push(drawn);
        logToResults(`🃏 Enemy draws ${drawn.name}`);
    }
    updateHands();
}

export function setSelectedAttacker(card) {
    selectedAttacker = card;
    console.log("DEBUG: Selected Attacker =", selectedAttacker);
}

export function setSelectedDefender(card) {
    selectedDefender = card;
    console.log("DEBUG: Selected Defender =", selectedDefender);
}

export function setPlayerHasPlacedCard(value) {
    gameState.playerHasPlacedCard = value;
    console.log("DEBUG: gameState.playerHasPlacedCard set to:", gameState.playerHasPlacedCard);
}

export function setEnemyHasPlacedCard(value) {
    gameState.enemyHasPlacedCard = value;
    console.log("DEBUG: gameState.enemyHasPlacedCard set to:", gameState.enemyHasPlacedCard);
}

import { playerHand, enemyHand, gameState, currentPlayerBattleCards, currentEnemyBattleCards, playerDeck, enemyDeck } from "./config.js";
import { createCardElement, determineCardType } from "./cards.js";
import { updatePlayerBattleCard, enemyPlaceCard, removeDefeatedCards, logToResults, updateHands } from "./display.js";

export let selectedAttacker = null;
export let selectedDefender = null;

export function drawCardsToFillHands() {
  // Player draw
  if (playerHand.length < 6 && playerDeck.length > 0) {
    const drawn = playerDeck.shift();
    playerHand.push(drawn);
    logToResults(`🃏 Player draws ${drawn.name}`);
  }

  // Enemy draw
  if (enemyHand.length < 6 && enemyDeck.length > 0) {
    const drawn = enemyDeck.shift();
    enemyHand.push(drawn);
    logToResults(`🃏 Enemy draws ${drawn.name}`);
  }
  updateHands();
}

export function setSelectedAttacker(card) {
    selectedAttacker = card;
}

export function setSelectedDefender(card) {
    selectedDefender = card;
}

export function setPlayerHasPlacedCard(value) {
    gameState.playerHasPlacedCard = value;
    console.log("DEBUG: gameState.playerHasPlacedCard set to:", value);
}

export function setEnemyHasPlacedCard(value) {
    gameState.enemyHasPlacedCard = value;
    console.log("DEBUG: gameState.enemyHasPlacedCard set to:", value);
}

// Debugging `placeCardInBattleZone`
export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
    console.log(`DEBUG: Trying to place ${card.name} in ${battleZoneId}`);
    console.log("DEBUG: currentPlayerBattleCards Before Placement:", currentPlayerBattleCards);
    
    const battleZone = document.getElementById(battleZoneId);
    if (!battleZone) return;

    battleZone.innerHTML = "";  // Clears previous card
    const type = determineCardType(card);
    console.log(`DEBUG: Determined card type for ${card.name} is ${type}`);

    const cardElement = createCardElement(card, type);
    battleZone.appendChild(cardElement);

    updateFunction(card, type);

    if (owner === "Player") {
        currentPlayerBattleCards[type] = card;
    } else {
        currentEnemyBattleCards[type] = card;
    }

    console.log(`🔄 ${owner} placed a ${type} card: ${card.name}`);
    console.log("DEBUG: currentPlayerBattleCards now =", currentPlayerBattleCards);
    console.log("DEBUG: currentEnemyBattleCards now =", currentEnemyBattleCards);
    return cardElement;
}

// Debugging `handleCardClick`
export function handleCardClick(card) {
    console.log("DEBUG: Clicked on card:", card);
    console.log("DEBUG: gameState.playerHasPlacedCard =", gameState.playerHasPlacedCard);
    console.log("DEBUG: currentPlayerBattleCards =", currentPlayerBattleCards);

    const type = determineCardType(card);
    
    console.log(`DEBUG: Checking if ${card.name} can be played...`);
    console.log("DEBUG: Current battle zone:", currentPlayerBattleCards);
    console.log("DEBUG: Clicked card class:", card.class);
    console.log("DEBUG: Existing classes in battle zone:", Object.values(currentPlayerBattleCards).map(c => c?.class));
    
    // 🛡️ If clicking a card in hand, place it in the battle zone
    if (playerHand.includes(card)) {
        if (!gameState.playerHasPlacedCard) { 
            if (!currentPlayerBattleCards[type] || type === "essence" || type === "ability") {
                console.log(`DEBUG: Placing ${card.name} in battle zone...`);
                placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");

                const index = playerHand.indexOf(card);
                if (index !== -1) playerHand.splice(index, 1);  // ✅ Modifies playerHand without reassigning it
                updateHands();
                console.log(`⚔️ ${card.name} placed in battle zone.`);
                
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

    // 🎯 If clicking a player's battle card, set it as the attacker
    if (currentPlayerBattleCards[type] === card) {
        setSelectedAttacker(card);
        console.log(`🎯 Selected Attacker: ${card.name}`);
        return;
    }

    // 🛡️ If clicking an enemy battle card, set it as the defender
    if (currentEnemyBattleCards[type] === card) {
        setSelectedDefender(card);
        console.log(`🛡️ Selected Defender: ${card.name}`);
        return;
    }

    console.warn("⚠️ Invalid selection. Place a card first, then select your attacker and defender.");
}
