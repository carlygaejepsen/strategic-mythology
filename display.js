import { createCardElement } from "./cards.js";
import { determineCardType } from "./cards.js";
import { playerHand, enemyHand, cardTemplates, gameConfig, currentPlayerBattleCards, currentEnemyBattleCards, gameState } from "./config.js";
import { setEnemyHasPlacedCard, placeCardInBattleZone, setPlayerHasPlacedCard } from "./interact.js";

// ✅ Updates only the player instruction box
export function updateInstructionText(phase) {
    const instructionBox = document.getElementById("instruction-box");
    if (!instructionBox) return;

    const instructionMessages = {
        "start": "It's your turn! Select a card to play.",
        "select-battle-card": "Choose a card to send to the battle zone.",
        "select-attacker": "Select your attacker.",
        "select-defender": "Choose which enemy to attack.",
        "combo": "Try combining abilities!",
        "waiting": "Waiting for opponent...",
    };

    instructionBox.textContent = instructionMessages[phase] || "Make your move!";
}

// ✅ Updates only the enemy status box
export function updateEnemyStatus(phase) {
    const enemyStatusBox = document.getElementById("enemy-status-box");
    if (!enemyStatusBox) return;

    const enemyMessages = {
        "enemy-start": "Enemy is preparing...",
        "enemy-select-battle-card": "Enemy is adding a card to the battle zone.",
        "enemy-select-attacker": "Enemy is selecting an attacker.",
        "enemy-select-defender": "Enemy is choosing a target.",
        "enemy-combo": "Enemy is trying a combo!",
        "enemy-waiting": "Enemy is thinking...",
    };

    enemyStatusBox.textContent = enemyMessages[phase] || "Enemy is strategizing...";
}

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

// 🛑 Removes only defeated cards without affecting the rest of the battle zone
export function removeDefeatedCards() {
    Object.entries(currentPlayerBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logToResults(`☠️ ${card.name} has been defeated!`);
            delete currentPlayerBattleCards[type];
            document.getElementById(`player-${type}-zone`).innerHTML = "";
            setPlayerHasPlacedCard(false);
            logToResults("🃏 Player may now place a new character card.");
        }
    });

    Object.entries(currentEnemyBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logToResults(`☠️ ${card.name} has been defeated!`);
            delete currentEnemyBattleCards[type];
            document.getElementById(`enemy-${type}-zone`).innerHTML = "";
            setEnemyHasPlacedCard(false);
            logToResults("🤖 Enemy will place a new character card.");
            enemyPlaceCard();
        }
    });
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
function updateCardHP(cardName, newHP) {
    let cardElement = document.querySelector(`[data-card-name="${cardName}"]`);

    // 🔥 Fix: If card doesn't exist in UI, attempt to re-render it
    if (!cardElement) {
        console.warn(`⚠️ Could not find card element for ${cardName}. Attempting to re-add.`);
        reRenderBattleCards(); // Ensure battle zone cards are properly rendered
        cardElement = document.querySelector(`[data-card-name="${cardName}"]`);
        if (!cardElement) {
            console.error(`❌ Card ${cardName} still not found after re-render. Skipping HP update.`);
            return;
        }
    }

    const hpElement = cardElement.querySelector(".hp");
    if (hpElement) {
        hpElement.textContent = `HP: ${newHP}`;
    }
}
function reRenderBattleCards() {
    console.log("🔄 Re-rendering battle cards to sync UI...");
    updateBattleZones(); // This function should redraw the battle cards
}
