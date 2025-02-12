import { createCardElement } from "./cards.js";
import { determineCardType } from "./cards.js";
import { playerHand, enemyHand, cardTemplates, gameConfig, currentPlayerBattleCards, currentEnemyBattleCards, gameState } from "./config.js";
import { setEnemyHasPlacedCard, placeCardInBattleZone } from "./interact.js";

export function logToResults(message) {
    const logElement = document.getElementById("results-log");
    if (!logElement) return;
    
    const entry = document.createElement("p");
    entry.textContent = message;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight; // Auto-scroll
}

export function updatePlayerBattleCard(card, type) {
    currentPlayerBattleCards[type] = card || null;
}

export function updateEnemyBattleCard(card, type) {
    currentEnemyBattleCards[type] = card || null;
}
//removeDefeatedCards 2.0
export function removeDefeatedCards() {
    let removedPlayerCard = false;
    let removedEnemyCard = false;

    // ⚔️ Remove defeated Character cards
    if (currentPlayerBattleCards.char?.hp <= 0) {
        logToResults(`☠️ ${currentPlayerBattleCards.char.name} has been defeated!`);
        currentPlayerBattleCards.char = null;
        document.getElementById("player-char-zone").innerHTML = "";  // ✅ Clears only this card
        removedPlayerCard = true;
    }
    if (currentEnemyBattleCards.char?.hp <= 0) {
        logToResults(`☠️ ${currentEnemyBattleCards.char.name} has been defeated!`);
        currentEnemyBattleCards.char = null;
        document.getElementById("enemy-char-zone").innerHTML = "";  // ✅ Clears only this card
        removedEnemyCard = true;
    }

    // 🌟 Remove Essence & Ability if they're at 0 HP
    ["essence", "ability"].forEach(type => {
        if (currentPlayerBattleCards[type]?.hp <= 0) {
            logToResults(`☠️ ${currentPlayerBattleCards[type].name} has been exhausted!`);
            currentPlayerBattleCards[type] = null;
            document.getElementById(`player-${type}-zone`).innerHTML = "";  // ✅ Clears only this card
        }
        if (currentEnemyBattleCards[type]?.hp <= 0) {
            logToResults(`☠️ ${currentEnemyBattleCards[type].name} has been exhausted!`);
            currentEnemyBattleCards[type] = null;
            document.getElementById(`enemy-${type}-zone`).innerHTML = "";  // ✅ Clears only this card
        }
    });

    // ✅ Allow new cards to be played, but without full refresh
    if (removedPlayerCard) {
        setPlayerHasPlacedCard(false);
        logToResults("🃏 Player may now place a new character card.");
    }
    if (removedEnemyCard) {
        setEnemyHasPlacedCard(false);
        logToResults("🤖 Enemy will place a new character card.");
        enemyPlaceCard();
    }
}

export function updateBattleZones() {
    ["char", "essence", "ability"].forEach(type => {
        const playerZone = document.getElementById(`player-${type}-zone`);
        const enemyZone = document.getElementById(`enemy-${type}-zone`);
        
        if (playerZone) {
            playerZone.innerHTML = "";
            if (currentPlayerBattleCards[type]) {
                playerZone.appendChild(createCardElement(currentPlayerBattleCards[type], type));
            }
        }
        
        if (enemyZone) {
            enemyZone.innerHTML = "";
            if (currentEnemyBattleCards[type]) {
                enemyZone.appendChild(createCardElement(currentEnemyBattleCards[type], type));
            }
        }
    });
    console.log("🛠️ Battle zones updated.");
}

export function removeCardFromHand(card, handArray, handId) {
    const index = handArray.indexOf(card);
    if (index !== -1) {
        handArray.splice(index, 1);
    }
    updateHand(handId, handArray);
}

export function updateHands() {
    updateHand("player-hand", playerHand);
    updateHand("enemy-hand", enemyHand);
}

export function updateHand(handId, handArray) {
    const handElement = document.getElementById(handId);
    if (!handElement) return;
    
    handElement.innerHTML = "";
    handArray.forEach(card => {
        const cardElement = createCardElement(card, "char");
        cardElement.addEventListener("click", () => {
            console.log(`🖱️ Clicked on card: ${card.name}`);
        });
        handElement.appendChild(cardElement);
    });
}
// 📌 Helper: Gets a random card from a battle zone
export function getRandomCardFromZone(battleZone) {
    const availableCards = Object.values(battleZone).filter(card => card !== null);
    return availableCards.length > 0 ? availableCards[Math.floor(Math.random() * availableCards.length)] : null;
}

export function enemyPlaceCard() {
    if (!gameState.enemyHasPlacedCard && enemyHand.length > 0) {
        const enemyCard = enemyHand.shift();
        const type = determineCardType(enemyCard);

        if (!currentEnemyBattleCards[type]) {
            placeCardInBattleZone(enemyCard, `enemy-${type}-zone`, updateEnemyBattleCard, "Enemy");
            console.log(`🤖 Enemy placed ${enemyCard.name} in battle.`);
            setEnemyHasPlacedCard(true);
        }
    }
}

// 🩸 Updates only the HP of a card in the battle zone without re-rendering the entire card.
export function updateCardHP(card) {
    if (!card || !card.id) return;
    
    // Locate the existing card element in the battle zone
    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
    
    if (!cardElement) {
        console.warn(`⚠️ Could not find card element for ${card.name} to update HP.`);
        return;
    }

    // Locate the HP display inside the card and update it
    const hpElement = cardElement.querySelector(".card-hp"); // Adjust selector as needed
    if (hpElement) {
        hpElement.textContent = card.hp; // Directly update HP
    } else {
        console.warn(`⚠️ No HP element found for ${card.name}.`);
    }
}
