// config.js - Handles game configurations, settings, data loading, and global references

// ✅ Turn Phases (ensuring compatibility with UI updates)
export const turnPhases = {
  SELECT_BATTLE_CARD: 'select-battle-card',  // Player places a card
  SELECT_ATTACKER: 'select-attacker',        // Player chooses attacker
  SELECT_COMBO: 'select-combo',              // Player optionally selects a combo ability
  SELECT_DEFENDER: 'select-defender',        // Player chooses enemy target
  PLAY_TURN: 'play-turn',                    // Player confirms turn execution
  ENEMY_SELECTION: 'enemy-select-battle-card', // Enemy places a card
  ENEMY_ATTACKER: 'enemy-select-attacker',   // Enemy chooses attacker
  ENEMY_DEFENDER: 'enemy-select-defender',   // Enemy chooses target
  ENEMY_PLAY_TURN: 'enemy-play-turn',        // Enemy executes turn
  WAITING: 'waiting',                        // Game waiting for actions
  COMBAT: 'battling'                         // Active combat phase
};

// ✅ Current Game Phase (updated dynamically)
export let currentPhase = turnPhases.SELECT_BATTLE_CARD;

export function setCurrentPhase(newPhase) {
  if (!Object.values(turnPhases).includes(newPhase)) {
    console.error(`🚨 ERROR: Invalid phase "${newPhase}" attempted!`);
    return;
  }
  console.log(`🔄 Phase Change: ${currentPhase} ➔ ${newPhase}`);
  currentPhase = newPhase;

  onGameStateChange(newPhase);
  onEnemyStateChange(newPhase);
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

// ✅ JSON Loading Helper (Internal)
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

// ✅ Fetches card templates and updates configuration
export async function loadConfigFiles() {
  try {
    console.log("📥 Fetching configuration files...");
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

// ✅ Loads character, essence, and ability cards from JSON and populates decks
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

    if (!characterDeck.length || !essenceDeck.length || !abilityDeck.length) {
      console.warn("⚠️ WARNING: One or more decks are empty!");
    }

    playerDeck = shuffleDeck([...characterDeck, ...essenceDeck, ...abilityDeck]);
    enemyDeck = shuffleDeck([...characterDeck, ...essenceDeck, ...abilityDeck]);
    console.log("✅ Decks successfully created.");
  } catch (error) {
    console.error("❌ ERROR loading cards:", error);
  }
}
