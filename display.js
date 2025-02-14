import { createCardElement } from "./cards.js";
import { determineCardType } from "./cards.js";
import { 
    playerHand, enemyHand, cardTemplates, gameConfig, 
    currentPlayerBattleCards, currentEnemyBattleCards, gameState 
} from "./config.js";
import { 
    setEnemyHasPlacedCard, placeCardInBattleZone, setPlayerHasPlacedCard 
} from "./interact.js";

// ✅ **Updates Player Instruction Box**
export function updateInstructionText(phase) {
    const instructionBox = document.getElementById("instruction-box");
    if (!instructionBox) return;

    const instructionMessages = {
        "start": "It's your turn! Select a card to play.",
        "select-battle-card": "Choose a card to send to the battle zone.",
        "select-attacker": "Select your attacker.",
        "select-combo": "Choose an ability to enhance your attack.",
        "select-defender": "Choose which enemy to attack.",
        "play-turn": "Click 'Play Turn' to continue.",
        "battling": "Battling...",
        "waiting": "Waiting for opponent...",
    };

    instructionBox.textContent = instructionMessages[phase] || "Make your move!";
}

// 🛡️ **Updates Enemy Status UI**
export function updateEnemyStatus(phase) {
    const enemyStatusBox = document.getElementById("enemy-status-box");
    if (!enemyStatusBox) return;

    const enemyMessages = {
        "enemy-start": "Enemy is preparing...",
        "enemy-select-battle-card": "Enemy is adding a card to the battle zone.",
        "enemy-select-attacker": "Enemy is selecting an attacker.",
        "enemy-select-defender": "Enemy is choosing a target.",
        "enemy-play-turn": "Enemy is attacking...",
        "enemy-battling": "Enemy is battling...",
        "enemy-combo": "Enemy is trying a combo!",
        "enemy-waiting": "Enemy is thinking...",
    };

    enemyStatusBox.textContent = enemyMessages[phase] || "Enemy is strategizing...";
}

// 📝 **Updates Player Instruction UI**
export function onGameStateChange(newState) {
    updateInstructionText(newState);
}

// 🔄 **Updates Enemy Phase UI**
export function onEnemyStateChange(newState) {
    updateEnemyStatus(newState);
}

// 📝 **Logs Battle Events to UI**
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
    let playerCardsDefeated = false;
    let enemyCardsDefeated = false;

    Object.entries(currentPlayerBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logToResults(`☠️ ${card.name} has been defeated!`);
            delete currentPlayerBattleCards[type];
            document.getElementById(`player-${type}-zone`).innerHTML = "";
            setPlayerHasPlacedCard(false);
            playerCardsDefeated = true;
        }
    });

    Object.entries(currentEnemyBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logToResults(`☠️ ${card.name} has been defeated!`);
            delete currentEnemyBattleCards[type];
            document.getElementById(`enemy-${type}-zone`).innerHTML = "";
            setEnemyHasPlacedCard(false);
            enemyCardsDefeated = true;
        }
    });

    // ✅ Ensure the correct phase reset **after combat completes**
    if (playerCardsDefeated || enemyCardsDefeated) {
        updateInstructionText("select-battle-card"); // 🔥 Returns to placing a new card
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

// 🔄 **Updates Hands for Both Players**
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

// 📌 **Helper: Gets a Random Card from a Battle Zone**
export function getRandomCardFromZone(battleZone) {
    const availableCards = Object.values(battleZone).filter(card => card !== null);
    return availableCards.length > 0 ? availableCards[Math.floor(Math.random() * availableCards.length)] : null;
}

// 🤖 **Handles Enemy AI Placing a Card**
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

// 🛑 **Removes Only Defeated Cards**
export function removeDefeatedCards() {
    let playerCardsDefeated = false;
    let enemyCardsDefeated = false;

    Object.entries(currentPlayerBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logToResults(`☠️ ${card.name} has been defeated!`);
            delete currentPlayerBattleCards[type];
            document.getElementById(`player-${type}-zone`).innerHTML = "";
            setPlayerHasPlacedCard(false);
            playerCardsDefeated = true;
        }
    });

    Object.entries(currentEnemyBattleCards).forEach(([type, card]) => {
        if (card?.hp <= 0) {
            logToResults(`☠️ ${card.name} has been defeated!`);
            delete currentEnemyBattleCards[type];
            document.getElementById(`enemy-${type}-zone`).innerHTML = "";
            setEnemyHasPlacedCard(false);
            enemyCardsDefeated = true;
        }
    });

    if (playerCardsDefeated || enemyCardsDefeated) {
        updateInstructionText("select-battle-card"); // 🔄 Resets to next turn
    }
}

// 🩸 **Updates Card HP in the Battle Zone Without Re-Drawing**
export function updateCardHP(card) {
    if (!card || !card.id) return;

    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);

    if (!cardElement) {
        console.warn(`⚠️ Could not find card element for ${card.name} to update HP.`);
        return;
    }

    const hpElement = cardElement.querySelector(".card-hp");
    if (hpElement) {
        hpElement.textContent = card.hp;
    } else {
        console.warn(`⚠️ No HP element found for ${card.name}.`);
    }
}
