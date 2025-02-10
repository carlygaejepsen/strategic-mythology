// config.js - Handles game configurations, settings, and data loading

let cardTemplates = {}; // Stores card templates loaded from JSON
let battleSystem = {}; // Stores battle system configurations

let playerDeck = []; // Stores player's deck
let enemyDeck = []; // Stores enemy's deck
export let playerHand = []; // Stores player's current hand
export let enemyHand = []; // Stores enemy's current hand

// Stores the player's and enemy's active battle cards (supports multiple slots)
let currentPlayerBattleCards = { char: null, essence: null, ability: null };
let currentEnemyBattleCards = { char: null, essence: null, ability: null };

// ✅ Function to load JSON data
async function loadJSON(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        return await response.json();
    } catch (error) {
        console.error("❌ ERROR fetching JSON:", error);
        return {};
    }
}

// ✅ Game configuration settings
let gameConfig = {
    "essence-emojis": {
        "fire": "🔥", "water": "🌊", "air": "💨", "earth": "🏔️",
        "electricity": "⚡", "zap": "⚡", "love": "💞", "malice": "🩸",
        "hubris": "🦚", "wisdom": "📖", "light": "🕯️", "dark": "🌑",
        "vit": "🌿", "decay": "🍂", "luck": "🪙", "just": "⚖️",
        "justice": "⚖️", "insight": "🔮"
    },
    "class-names": {
        "mals": "Malevolent", "wilds": "Wildkeeper", "cares": "Caretaker",
        "heroes": "Hero", "ecs": "Ecstatic", "warriors": "Warrior",
        "wars": "Warrior", "auth": "Authority", "sages": "Sage",
        "mys": "Mystic", "oracles": "Oracle"
    },
    "battle-messages": {
        "battleStart": "{player} vs {enemy} begins!",
        "attackMessage": "{attacker} attacks {defender} for {damage} damage!",
        "defeatMessage": "{card} is defeated!",
        "criticalHit": "💥 Critical hit! {attacker} deals {damage} damage to {defender}!",
        "dodgeMessage": "✨ {defender} dodged the attack from {attacker}!"
    },
    "damageCalculation": {
        "formula": "atk - def",
        "minDamage": 1,
        "criticalMultiplier": 1.5,
        "essenceBonusMultiplier": 1.2,
        "classBonusMultiplier": 1.2
    }
};

// ✅ Load configuration files (card templates + battle system rules)
async function loadConfigFiles() {
    try {
        console.log("📥 Fetching configuration files...");

        const cardTemplatesResponse = await fetch("./card-templates.json");
        if (!cardTemplatesResponse.ok) throw new Error(`Failed to fetch card-templates.json`);

        cardTemplates = await cardTemplatesResponse.json();
        Object.assign(battleSystem, await loadJSON("./data/bat-sys.json"));

        console.log("✅ Configurations loaded.");
    } catch (error) {
        console.error("❌ ERROR loading configuration files:", error);
    }
}

// ✅ Shuffle deck function
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// ✅ Load all cards from JSON files
async function loadAllCards() {
    try {
        console.log("📥 Fetching all card data...");

        const characterFiles = [
            "./data/beast-chars.json", "./data/bully-chars.json", "./data/celestial-chars.json",
            "./data/hero-chars.json", "./data/life-chars.json", "./data/mystical-chars.json",
            "./data/olympian-chars.json", "./data/plant-chars.json", "./data/underworld-chars.json",
            "./data/water-chars.json"
        ];

        const [characterDeck, essenceDeck, abilityDeck] = await Promise.all([
            Promise.all(characterFiles.map(loadJSON)).then(results => results.flat()),
            loadJSON("./data/essence-cards.json"),
            loadJSON("./data/ability-cards.json")
        ]);

        const fullDeck = [...characterDeck, ...essenceDeck, ...abilityDeck];
        playerDeck = shuffleDeck([...fullDeck]);
        enemyDeck = shuffleDeck([...fullDeck]);

        console.log("✅ Player Deck:", playerDeck);
        console.log("✅ Enemy Deck:", enemyDeck);
    } catch (error) {
        console.error("❌ ERROR loading cards:", error);
    }
}

// ✅ Export all necessary data
export { 
    cardTemplates, 
    gameConfig, 
    battleSystem, 
    loadConfigFiles, 
    loadJSON, 
    loadAllCards, 
    shuffleDeck, 
    playerDeck, 
    enemyDeck, 
    playerHand, 
    enemyHand, 
    currentPlayerBattleCards, 
    currentEnemyBattleCards 
};
