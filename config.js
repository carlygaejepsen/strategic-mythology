import { logDebug, logError, logWarn } from "./utils/logger.js";
import { onGameStateChange, onEnemyStateChange } from "./ui-display.js";

// config.js - Handles game configurations, settings, data loading, and global references

export const debugMode = false; // Set to true for debugging, false to reduce logs

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
    logError(`🚨 ERROR: Invalid phase "${newPhase}" attempted!`);
    return;
  }
  logDebug(`🔄 Phase Change: ${currentPhase} ➔ ${newPhase}`);
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
    "mys": "Mystic", "oracles": "Oracle",
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
    logError("❌ ERROR fetching JSON:", error);
  }
}

// ✅ Fetches card templates and updates configuration
export async function loadConfigFiles() {
  try {
    logDebug("📥 Fetching configuration files...");
    const cardTemplatesResponse = await fetch("./card-templates.json");
    if (!cardTemplatesResponse.ok) throw new Error(`Failed to fetch card-templates.json`);
    cardTemplates = await cardTemplatesResponse.json();
    logDebug("✅ Configurations loaded.");
  } catch (error) {
    logError("❌ ERROR loading configuration files:", error);
  }
}

// ✅ Shuffle function (Fisher-Yates algorithm)
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// ✅ Loads character, essence, and ability cards from JSON and populates decks
export async function loadAllCards() {
  try {
    logDebug("📥 Fetching all card data...");
    const characterFiles = [
      "./data/beast-chars.json", "./data/bully-chars.json", "./data/celestial-chars.json",
      "./data/hero-chars.json", "./data/life-chars.json", "./data/mystical-chars.json",
      "./data/water-chars.json"
    ];

    const [characterDeck, essenceDeck, abilityDeck] = await Promise.all([
      Promise.all(characterFiles.map(loadJSON)).then(results => results.flat()),
      loadJSON("./data/essence-cards.json"),
      loadJSON("./data/ability-cards.json")
    ]);

    if (!characterDeck.length || !essenceDeck.length || !abilityDeck.length) {
      logWarn("⚠️ WARNING: One or more decks are empty!");
    } else {
      playerDeck = [...characterDeck, ...essenceDeck, ...abilityDeck];
      enemyDeck = [...characterDeck, ...essenceDeck, ...abilityDeck];
      shuffleDeck(playerDeck);
      shuffleDeck(enemyDeck);
      logDebug("✅ All cards loaded and decks shuffled.");
    }
  } catch (error) {
    logError("❌ ERROR loading cards:", error);
  }
}
