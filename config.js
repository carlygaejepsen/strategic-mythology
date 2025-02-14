// config.js - Handles game configurations, settings, data loading, and global references

// ✅ Turn Phases (for dynamic tracking)
export const turnPhases = {
  PLAYER_SELECTION: 'player',
  ENEMY_SELECTION: 'enemy',
  COMBAT: 'combat'
};

// ✅ Current Game Phase (updated dynamically)
export let currentPhase = turnPhases.PLAYER_SELECTION;
export function setCurrentPhase(newPhase) {
    console.log(`🔄 Phase Change: ${currentPhase} ➝ ${newPhase}`);
    currentPhase = newPhase;
}

// ✅ Core Objects (non-const so we can reassign if needed)
export let cardTemplates = {};

// ✅ Decks & Hands (Mutable arrays)
export let playerDeck = [];
export let enemyDeck = [];
export let playerHand = [];
export let enemyHand = [];

// ✅ Game State Tracking
export let gameState = {
    playerHasPlacedCard: false,
    enemyHasPlacedCard: false
};

// ✅ Active Battle Cards
export let currentPlayerBattleCards = { char: null, essence: null, ability: null };
export let currentEnemyBattleCards = { char: null, essence: null, ability: null };

// ✅ JSON Loading Helper
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

// ✅ Game-wide config (settings, texts, placeholders)
export let gameConfig = {
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

// ✅ Fetches card templates + merges `battle-system.json` into `gameConfig`
export async function loadConfigFiles() {
    try {
        console.log("📥 Fetching configuration files...");

        // Fetch card templates
        const cardTemplatesResponse = await fetch("./card-templates.json");
        if (!cardTemplatesResponse.ok) throw new Error(`Failed to fetch card-templates.json`);
        cardTemplates = await cardTemplatesResponse.json();

        console.log("✅ Configurations loaded.");
    } catch (error) {
        console.error("❌ ERROR loading configuration files:", error);
    }
}

// ✅ Shuffle function (Fisher-Yates algorithm)
export function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// ✅ Loads character, essence, and ability cards from JSON, populates decks
let cardsLoaded = false;

export async function loadAllCards() {
    if (cardsLoaded) return; // Prevent multiple reloads
    cardsLoaded = true; 

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

        // Ensure valid card loading
        if (!characterDeck.length || !essenceDeck.length || !abilityDeck.length) {
            console.warn("⚠️ WARNING: One or more decks are empty!");
        }

        const fullDeck = [...characterDeck, ...essenceDeck, ...abilityDeck];

        // Do not clear hands so they persist between turns.
        // playerHand.length = 0;
        // enemyHand.length = 0;

        // Shuffle and assign decks
        playerDeck = shuffleDeck([...fullDeck]);
        enemyDeck = shuffleDeck([...fullDeck]);

        console.log("✅ Player Deck:", playerDeck);
        console.log("✅ Enemy Deck:", enemyDeck);
    } catch (error) {
        console.error("❌ ERROR loading cards:", error);
    }
}
