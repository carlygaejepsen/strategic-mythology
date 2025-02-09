import { loadJSON, cardTemplates } from "./config.js"; // ✅ Import JSON loader and card templates

function populateTemplate(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => data[key] || '');
}

async function loadAllCards() {
    try {
        const characterFiles = [
            "./data/beast-chars.json", "./data/bully-chars.json", "./data/celestial-chars.json",
            "./data/hero-chars.json", "./data/life-chars.json", "./data/mystical-chars.json",
            "./data/olympian-chars.json", "./data/plant-chars.json", "./data/underworld-chars.json",
            "./data/water-chars.json"
        ];

        // Loads all character decks
        let characterDeck = (await Promise.all(characterFiles.map(loadJSON))).flat();
        let essenceDeck = await loadJSON("./data/essence-cards.json"); // Loads essence cards
        let abilityDeck = await loadJSON("./data/ability-cards.json"); // Loads ability cards
        battleSystem = await loadJSON("./data/bat-sys.json"); // Loads battle system rules

        // Combines all cards into a full deck
        let fullDeck = [...characterDeck, ...essenceDeck, ...abilityDeck];

        // Shuffles decks separately for player and enemy
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
export { playerDeck, enemyDeck, playerHand, enemyHand, loadAllCards, shuffleDeck };
