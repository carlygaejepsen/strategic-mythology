import { loadJSON, cardTemplates, battleSystem } from "./config.js";

let playerDeck = [];
let enemyDeck = [];
let playerHand = [];
let enemyHand = [];

let currentPlayerBattleCard = null;
let currentEnemyBattleCard = null;

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

        console.log("Player Deck:", playerDeck);
        console.log("Enemy Deck:", enemyDeck);
    } catch (error) {
        console.error("Error loading cards:", error);
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
        console.error("Not enough cards to deal starting hands.");
        return;
    }

    playerHand = playerDeck.splice(0, HAND_SIZE);
    enemyHand = enemyDeck.splice(0, HAND_SIZE);

    console.log("Player Hand:", playerHand);
    console.log("Enemy Hand:", enemyHand);
}

export { playerDeck, enemyDeck, playerHand, enemyHand, loadAllCards, shuffleDeck, dealStartingHands };
