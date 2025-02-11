import { playerHand, enemyHand, gameState, currentPlayerBattleCards, currentEnemyBattleCards } from "./config.js";
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
    gameState.playerHasPlacedCard = value;  // ✅ Now updates correctly across files
}

export function setEnemyHasPlacedCard(value) {
    Object.assign(enemyHasPlacedCard, { value });  // ✅ This modifies the value safely
}

//placeCardInBattleZone 2.0
export function placeCardInBattleZone(card, battleZoneId, updateFunction, owner) {
    const battleZone = document.getElementById(battleZoneId);
    if (!battleZone) return;

    battleZone.innerHTML = "";  // Clears previous card
    const cardElement = createCardElement(card, determineCardType(card));
    battleZone.appendChild(cardElement);

    updateFunction(card, determineCardType(card));

    // 🔹 Ensure currentPlayerBattleCards is updated
    if (owner === "Player") {
        currentPlayerBattleCards[determineCardType(card)] = card;  // ✅ Correctly assigns
    } else {
        currentEnemyBattleCards[determineCardType(card)] = card;  // ✅ Correctly assigns
    }

    console.log(`🔄 ${owner} placed a ${determineCardType(card)} card: ${card.name}`);
    return cardElement;
}


// handleCardClick 10.0
export function handleCardClick(card) {
    const type = determineCardType(card);

    // 🛡️ If clicking a card in hand, place it in the battle zone
    if (playerHand.includes(card)) {
        if (!playerHasPlacedCard) { 
            if (!currentPlayerBattleCards[type]) {
                placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");

				const index = playerHand.indexOf(card);
				if (index !== -1) playerHand.splice(index, 1);  // ✅ Modifies playerHand without reassigning it
                updateHands();
                console.log(`⚔️ ${card.name} placed in battle zone.`);
                
                setPlayerHasPlacedCard(true); 

                // ✅ As soon as the player places their card, AI places its card
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
