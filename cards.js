import {
    loadJSON,
    cardTemplates,
    battleSystem,
    gameConfig,
    playerDeck,
    enemyDeck,
    shuffleDeck,
    currentPlayerBattleCards,
    currentEnemyBattleCards,
	updatePlayerBattleCard,
	updateEnemyBattleCard,
	playerHasPlacedCard,
	setPlayerHasPlacedCard,
	selectedAttacker, 
	selectedDefender, 
	setSelectedAttacker, 
	setSelectedDefender 
} from "./config.js";
import { placeCardInBattleZone, updateHands } from "./display.js";}
import { enemyPlaceCard} from "./battle.js"}
// ✅ Locally define playerHand & enemyHand as "let"
export let playerHand = [];
export let enemyHand = [];

// Replaces placeholders in a template with provided data
function populateTemplate(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => (key in data ? data[key] : match));
}
// Deals starting hands from the decks and updates the UI
function dealStartingHands() {
    const HAND_SIZE = 6;
    if (playerDeck.length < HAND_SIZE || enemyDeck.length < HAND_SIZE) {
        console.error("❌ Not enough cards to deal starting hands.");
        return;
    }

    // ✅ Move cards from deck to hand
    playerHand.length = 0; // Clear previous hands
    enemyHand.length = 0;
    
    playerHand.push(...playerDeck.splice(0, HAND_SIZE));
    enemyHand.push(...enemyDeck.splice(0, HAND_SIZE));

    updateHands(); // ✅ Refresh UI after dealing

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

// handleCardClick 9.0
function handleCardClick(card) {
    const type = determineCardType(card);

    // 🛡️ If clicking a card in hand, place it in the battle zone
    if (playerHand.includes(card)) {
        if (!playerHasPlacedCard) { 
            if (!currentPlayerBattleCards[type]) {
                placeCardInBattleZone(card, `player-${type}-zone`, updatePlayerBattleCard, "Player");

                playerHand = playerHand.filter(c => c !== card);
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

export {
    // Deck & Hand references
    playerDeck,
    enemyDeck,

    // Battle card references
    currentPlayerBattleCards,
    currentEnemyBattleCards,
    shuffleDeck,
    dealStartingHands,
    createCardElement,
    handleCardClick,
    determineCardType
};
