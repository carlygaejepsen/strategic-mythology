import { loadJSON, cardTemplates, battleSystem, gameConfig } from "./config.js";

let playerDeck = [];
let enemyDeck = [];
let playerHand = [];
let enemyHand = [];

let currentPlayerBattleCards = { char: null, essence: null, ability: null };
let currentEnemyBattleCards = { char: null, essence: null, ability: null };

function populateTemplate(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => (key in data ? data[key] : match));
}

async function loadAllCards() {
    try {
        const characterFiles = [
            "./data/beast-chars.json", "./data/bully-chars.json", "./data/celestial-chars.json",
            "./data/hero-chars.json", "./data/life-chars.json", "./data/mystical-chars.json",
            "./data/olympian-chars.json", "./data/plant-chars.json", "./data/underworld-chars.json",
            "./data/water-chars.json"
        ];

        const [characterDeck, essenceDeck, abilityDeck, battleData] = await Promise.all([
            Promise.all(characterFiles.map(loadJSON)).then(results => results.flat()),
            loadJSON("./data/essence-cards.json"),
            loadJSON("./data/ability-cards.json"),
            loadJSON("./data/bat-sys.json")
        ]);

        Object.assign(battleSystem, battleData);

        const fullDeck = [...characterDeck, ...essenceDeck, ...abilityDeck];
        playerDeck = shuffleDeck([...fullDeck]);
        enemyDeck = shuffleDeck([...fullDeck]);

        console.log("✅ Player Deck:", playerDeck);
        console.log("✅ Enemy Deck:", enemyDeck);
    } catch (error) {
        console.error("❌ ERROR loading cards:", error);
    }
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function dealStartingHands() {
    const HAND_SIZE = 6;

    if (playerDeck.length < HAND_SIZE || enemyDeck.length < HAND_SIZE) {
        console.error("❌ Not enough cards to deal starting hands.");
        return;
    }

    playerHand = playerDeck.splice(0, HAND_SIZE);
    enemyHand = enemyDeck.splice(0, HAND_SIZE);

    console.log("🎴 Player Hand:", playerHand);
    console.log("🎴 Enemy Hand:", enemyHand);
}

function createCardElement(card, type) {
    console.log(`🎨 Creating card: ${card.name} (Type: ${type})`);

    let computedType;
    if (type) {
        computedType = type;
    } else if (Array.isArray(card.classes) && Array.isArray(card.essences)) {
        computedType = "char";
    } else if (card.essence) {
        computedType = "essence";
    } else {
        computedType = "ability";
    }

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
        essence_emoji: card.essence ? (gameConfig["essence-emojis"]?.[card.essence] || "❓") : "",
        classes: Array.isArray(card.classes)
            ? card.classes.map(cls => `<span class="class-tag">${gameConfig["class-names"]?.[cls] || cls}</span>`).join(", ")
            : "",
        essences: Array.isArray(card.essences)
            ? card.essences.map(ess => `<span class="essence ${ess}">${gameConfig["essence-emojis"]?.[ess] || ess}</span>`).join(" ")
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

function handleCardClick(card) {
    console.log(`🔹 Player selected: ${card.name}`);

    let type = "char";
    if (card.essence) type = "essence";
    else if (!card.classes) type = "ability";

    const playerBattleZone = document.getElementById(`player-${type}-zone`);
    if (playerBattleZone) {
        playerBattleZone.innerHTML = ""; // ✅ Replace only that type of card
        playerBattleZone.appendChild(createCardElement(card, type));
        updatePlayerBattleCard(card, type);
    }

    if (!currentEnemyBattleCards.char && enemyHand.length > 0) {
        const enemyCard = enemyHand.shift();
        console.log(`🔹 Enemy selected: ${enemyCard.name}`);

        let enemyType = "char";
        if (enemyCard.essence) enemyType = "essence";
        else if (!enemyCard.classes) enemyType = "ability";

        const enemyBattleZone = document.getElementById(`enemy-${enemyType}-zone`);
        if (enemyBattleZone) {
            enemyBattleZone.innerHTML = "";
            enemyBattleZone.appendChild(createCardElement(enemyCard, enemyType));
            updateEnemyBattleCard(enemyCard, enemyType);
        }
    } else {
        console.log("⚠️ No enemy cards left.");
    }
}

// ✅ Functions to update battle cards for each type
function updatePlayerBattleCard(card, type) {
    currentPlayerBattleCards[type] = card;
    console.log(`🔄 Player ${type} battle card updated: ${card ? card.name : "None"}`);
}

function updateEnemyBattleCard(card, type) {
    currentEnemyBattleCards[type] = card;
    console.log(`🔄 Enemy ${type} battle card updated: ${card ? card.name : "None"}`);
}

// ✅ Export everything needed in `battle.js`
export { 
    playerDeck, 
    enemyDeck, 
    playerHand, 
    enemyHand, 
    currentPlayerBattleCards, 
    currentEnemyBattleCards, 
    updatePlayerBattleCard, 
    updateEnemyBattleCard, 
    loadAllCards, 
    shuffleDeck, 
    dealStartingHands, 
    createCardElement, 
    handleCardClick 
};
