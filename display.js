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

export function removeDefeatedCards() {
    let removedPlayerCard = false;
    let removedEnemyCard = false;

    // ⚔️ Remove defeated Character cards
    if (currentPlayerBattleCards.char?.hp <= 0) {
        logToResults(`☠️ ${currentPlayerBattleCards.char.name} has been defeated!`);
        currentPlayerBattleCards.char = null;
        removedPlayerCard = true;
    }
    if (currentEnemyBattleCards.char?.hp <= 0) {
        logToResults(`☠️ ${currentEnemyBattleCards.char.name} has been defeated!`);
        currentEnemyBattleCards.char = null;
        removedEnemyCard = true;
    }

    // 🌟 Remove Essence & Ability if they're at 0 HP
    ["essence", "ability"].forEach(type => {
        if (currentPlayerBattleCards[type]?.hp <= 0) {
            logToResults(`☠️ ${currentPlayerBattleCards[type].name} has been exhausted!`);
            currentPlayerBattleCards[type] = null;
        }
        if (currentEnemyBattleCards[type]?.hp <= 0) {
            logToResults(`☠️ ${currentEnemyBattleCards[type].name} has been exhausted!`);
            currentEnemyBattleCards[type] = null;
        }
    });

    // After removing defeated cards, refresh the battle zones
    updateBattleZones();
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
    if (!enemyHasPlacedCard && enemyHand.length > 0) {
        const enemyCard = enemyHand.shift();
        const type = determineCardType(enemyCard);

        if (!currentEnemyBattleCards[type]) {
            placeCardInBattleZone(enemyCard, `enemy-${type}-zone`, updateEnemyBattleCard, "Enemy");
            console.log(`🤖 Enemy placed ${enemyCard.name} in battle.`);
            setEnemyHasPlacedCard(true);
        }
    }
}
