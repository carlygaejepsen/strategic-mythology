import {
    loadJSON,
    cardTemplates,
    battleSystem,
    gameConfig,
    playerDeck,
    enemyDeck,
    // ❌ Remove the conflicting imports for playerHand/enemyHand here
    currentPlayerBattleCards,
    currentEnemyBattleCards
} from "./config.js";
import { placeCardInBattleZone, updateHands } from "./display.js";

// ✅ Locally define playerHand & enemyHand as "let"
export let playerHand = [];
export let enemyHand = [];

// Replaces placeholders in a template with provided data
function populateTemplate(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => (key in data ? data[key] : match));
}

// Shuffles a deck using the Fisher-Yates algorithm
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Deals starting hands from the decks and updates the UI
function dealStartingHands() {
    const HAND_SIZE = 6;
    if (playerDeck.length < HAND_SIZE || enemyDeck.length < HAND_SIZE) {
        console.error("❌ Not enough cards to deal starting hands.");
        return;
    }
    // Clear any old hands
    playerHand.length = 0;
    enemyHand.length = 0;

    // Populate new hands
    playerHand.push(...playerDeck.splice(0, HAND_SIZE));
    enemyHand.push(...enemyDeck.splice(0, HAND_SIZE));
    updateHands();

    console.log("🎴 Player Hand:", playerHand);
    console.log("🎴 Enemy Hand:", enemyHand);
}

// Determines the type of a card based on its properties
function determineCardType(card) {
    if (card.essence) return "essence";
    return card.classes ? "char" : "ability";
}

// Creates a card element for UI display, wrapped in a .card-container
function createCardElement(card, type) {
    console.log(`🎨 Creating card: ${card.name} (Type: ${type})`);
    const computedType = determineCardType(card);

    if (!cardTemplates[computedType]) {
        console.error(`❌ ERROR: Missing template for card type: ${computedType}`);
        return document.createElement("div");
    }

    // Populate the HTML template
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

    // 1️⃣ Create the container element
    const containerDiv = document.createElement("div");
    containerDiv.classList.add("card-container"); 

    // 2️⃣ Create the main card element
    const cardDiv = document.createElement("div");
    cardDiv.classList.add(`${computedType}-card`);
    cardDiv.innerHTML = populatedHTML;

    // 3️⃣ Insert the main card into the container
    containerDiv.appendChild(cardDiv);

    // 4️⃣ Add click handling on the container
    containerDiv.addEventListener("click", () => {
        console.log(`🖱️ Clicked on card: ${card.name}`);
        handleCardClick(card);
    });

    return containerDiv;
}

// Handles the player's card selection, moves the card to the battle zone,
// and removes it from the player's hand.
function handleCardClick(card) {
    console.log(`🔹 Player selected: ${card.name}`);
    const type = determineCardType(card);

    // Place the clicked card in the appropriate battle zone
    placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");

    // Remove the card from the player's hand
    playerHand = playerHand.filter(c => c !== card); 
    updateHands();
    console.log("⚠️ Player hand updated:", playerHand);
}

// Updates the player's active battle card (for a given type)
function updatePlayerBattleCard(card, type) {
    currentPlayerBattleCards[type] = card || null;
}

// Updates the enemy's active battle card (for a given type)
function updateEnemyBattleCard(card, type) {
    currentEnemyBattleCards[type] = card || null;
}

export {
    // Deck & Hand references
    playerDeck,
    enemyDeck,
    playerHand,
    enemyHand,

    // Battle card references
    currentPlayerBattleCards,
    currentEnemyBattleCards,

    // Functions
    updatePlayerBattleCard,
    updateEnemyBattleCard,
    shuffleDeck,
    dealStartingHands,
    createCardElement,
    handleCardClick,
    determineCardType
};
