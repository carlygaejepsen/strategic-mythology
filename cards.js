import { loadJSON, cardTemplates, battleSystem, gameConfig } from "./config.js";
import { placeCardInBattleZone, updateHands } from "./display.js"; // ✅ UI functions handled separately

let playerDeck = [];
let enemyDeck = [];
let playerHand = [];
let enemyHand = [];

let currentPlayerBattleCards = { char: null, essence: null, ability: null };
let currentEnemyBattleCards = { char: null, essence: null, ability: null };

// ✅ Ensures correct template data replacement
function populateTemplate(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => (key in data ? data[key] : match));
}

// ✅ Shuffles deck using Fisher-Yates algorithm
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// ✅ Deals starting hands
function dealStartingHands() {
    const HAND_SIZE = 6;

    if (playerDeck.length < HAND_SIZE || enemyDeck.length < HAND_SIZE) {
        console.error("❌ Not enough cards to deal starting hands.");
        return;
    }

    playerHand = playerDeck.splice(0, HAND_SIZE);
    enemyHand = enemyDeck.splice(0, HAND_SIZE);

    updateHands(); // ✅ Updates the UI to reflect the new hands

    console.log("🎴 Player Hand:", playerHand);
    console.log("🎴 Enemy Hand:", enemyHand);
}

// ✅ Determines card type correctly
function determineCardType(card) {
    if (card.essence) return "essence";
    return card.classes ? "char" : "ability";
}

// ✅ Creates a card element for UI display
function createCardElement(card, type) {
    console.log(`🎨 Creating card: ${card.name} (Type: ${type})`);

    let computedType = determineCardType(card);
    if (!cardTemplates[computedType]) {
        console.error(`❌ ERROR: Missing template for card type: ${computedType}`);
        return document.createElement("div");
    }

    const template = cardTemplates[computedType].html;
    const populatedHTML = populateTemplate(template, {
        name: card.name || "Unknown",
        img: card.img || "",
        hp: card.hp ?? "",
        atk: card.atk ?? "",
        def: card.def ?? "",
        spd: card.spd ?? "",
        essence: card.essence || "",
        essence_emoji: card.essence ? (gameConfig?.["essence-emojis"]?.[card.essence] || "❓") : "",
        classes: Array.isArray(card.classes)
            ? card.classes.map(cls => `<span class="class-tag">${gameConfig?.["class-names"]?.[cls] || cls}</span>`).join(", ")
            : "",
        essences: Array.isArray(card.essences)
            ? card.essences.map(ess => `<span class="essence ${ess}">${gameConfig?.["essence-emojis"]?.[ess] || ess}</span>`).join(" ")
            : ""
    });

    const cardDiv = document.createElement("div");
    cardDiv.classList.add(`${computedType}-card`);
    cardDiv.innerHTML = populatedHTML;

    cardDiv.addEventListener("click", () => {
        console.log(`🖱️ Clicked on card: ${card.name}`);
        handleCardClick(card);
    });

    return cardDiv;
}

// ✅ Handles card selection and moves it to the battle zone
function handleCardClick(card) {
    console.log(`🔹 Player selected: ${card.name}`);

    const type = determineCardType(card);
    placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");

    // ✅ Removes the selected card from the player's hand
    playerHand = playerHand.filter(c => c !== card);
    updateHands(); // ✅ Refreshes the UI to reflect the change

    console.log("⚠️ Player hand updated:", playerHand);
}

// ✅ Updates the player's active battle card
function updatePlayerBattleCard(card, type) {
    currentPlayerBattleCards[type] = card || null;
}

// ✅ Updates the enemy's active battle card
function updateEnemyBattleCard(card, type) {
    currentEnemyBattleCards[type] = card || null;
}

// ✅ Exports everything needed for game functionality
export {
    playerDeck,
    enemyDeck,
    playerHand,
    enemyHand,
    currentPlayerBattleCards,
    currentEnemyBattleCards,
    updatePlayerBattleCard,
    updateEnemyBattleCard,
    shuffleDeck,
    dealStartingHands,
    createCardElement,
    handleCardClick
};
