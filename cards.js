import { cardTemplates, gameConfig } from "./config.js";

let playerDeck = [];
let enemyDeck = [];
let playerHand = [];
let enemyHand = [];

// Shuffle function
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Create Card Elements
function createCardElement(card, type) {
    console.log(`Creating card: ${card.name} (Type: ${type})`);

    let computedType = type || card.type;

    if (!cardTemplates[computedType]) {
        console.error(`❌ ERROR: Missing template for card type: ${computedType}`);
        return document.createElement("div"); 
    }

    const template = cardTemplates[computedType].html;

    const populatedHTML = template.replace(/{(\w+)}/g, (match, key) => card[key] || "");

    const cardDiv = document.createElement("div");
    cardDiv.classList.add(`${computedType}-card`);
    cardDiv.innerHTML = populatedHTML;

    cardDiv.addEventListener("click", () => handleCardClick(card));

    return cardDiv;
}

// Handle Player Clicking a Card
function handleCardClick(card) {
    console.log(`🔹 Player selected: ${card.name}`);

    const playerBattleZone = document.getElementById("player-battle-zone");
    playerBattleZone.appendChild(createCardElement(card, card.type));

    const cardIndex = playerHand.indexOf(card);
    if (cardIndex !== -1) playerHand.splice(cardIndex, 1);

    // Remove card from UI
    document.querySelector(`#player-hand [data-card-id="${card.id}"]`)?.remove();

    // Enemy Plays a Card
    if (enemyHand.length > 0) {
        const enemyCard = enemyHand.shift();
        console.log(`🔹 Enemy selected: ${enemyCard.name}`);
        document.getElementById("enemy-battle-zone").appendChild(createCardElement(enemyCard, enemyCard.type));
        document.querySelector(`#enemy-hand [data-card-id="${enemyCard.id}"]`)?.remove();
    } else {
        console.log("⚠️ No enemy cards left.");
    }
}

// Deal Hands
function dealStartingHands() {
    playerHand = [];
    enemyHand = [];

    for (let i = 0; i < 5; i++) {
        if (playerDeck.length > 0) playerHand.push(playerDeck.pop());
        if (enemyDeck.length > 0) enemyHand.push(enemyDeck.pop());
    }

    playerHand.forEach(card => document.getElementById("player-hand").appendChild(createCardElement(card, card.type)));
    enemyHand.forEach(card => document.getElementById("enemy-hand").appendChild(createCardElement(card, card.type)));
}

export { shuffleDeck, createCardElement, handleCardClick, dealStartingHands, playerDeck, enemyDeck };
