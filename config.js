// config.js - Handles game configurations, settings, data loading, and global references
// Add to gameConfig
export const turnPhases = {
  PLAYER_SELECTION: 'player',
  ENEMY_SELECTION: 'enemy',
  COMBAT: 'combat'
};

// Add current phase tracking
export let currentPhase = turnPhases.PLAYER_SELECTION;

// Core objects (non-const so we can reassign if needed)
let cardTemplates = {}; // Stores card templates loaded from JSON
let battleSystem = {};  // Stores battle system configurations

// Decks & Hands (export as let so we can mutate them freely)
export let playerDeck = [];    // Player's deck
export let enemyDeck = [];     // Enemy's deck
export let playerHand = [];    // Player's current hand
export let enemyHand = [];     // Enemy's current hand

// Active Battle Cards
let currentPlayerBattleCards = { char: null, essence: null, ability: null };
let currentEnemyBattleCards = { char: null, essence: null, ability: null };

// JSON loading helper
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

// Game-wide config (texts, placeholders, etc.)
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

// Fetches card templates + merges bat-sys.json data into battleSystem
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

// Shuffle function (Fisher-Yates)
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Loads character, essence, and ability cards from JSON, populates playerDeck & enemyDeck
let cardsLoaded = false; // Prevents multiple reloads

async function loadAllCards() {
    if (cardsLoaded) return; // If already loaded, do nothing
    cardsLoaded = true; // Mark as loaded

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

        // Ensure hands are empty before loading new decks
        playerHand.length = 0;
        enemyHand.length = 0;

        playerDeck = shuffleDeck([...fullDeck]);
        enemyDeck = shuffleDeck([...fullDeck]);

        console.log("✅ Player Deck:", playerDeck);
        console.log("✅ Enemy Deck:", enemyDeck);
    } catch (error) {
        console.error("❌ ERROR loading cards:", error);
    }
}


// Export all data & functions so other modules can use them
export {
    cardTemplates,
    gameConfig,
    battleSystem,
    loadConfigFiles,
    loadJSON,
    loadAllCards,
    shuffleDeck,

    // Active battle cards
    currentPlayerBattleCards,
    currentEnemyBattleCards
};
