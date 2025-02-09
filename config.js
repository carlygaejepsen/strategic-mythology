
let cardTemplates = {}; // Stores card templates loaded from JSON
let gameConfig = {};  // Stores general game settings
let battleSystem = {}; // Stores battle system configurations

let playerDeck = []; // Stores player's deck
let enemyDeck = []; // Stores enemy's deck
let playerHand = []; // Stores player's current hand
let enemyHand = []; // Stores enemy's current hand

let currentPlayerBattleCard = null; // Tracks the player's active battle card
let currentEnemyBattleCard = null; // Tracks the enemy's active battle card

async function loadJSON(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching JSON:", error);
        return [];
    }
}

async function loadConfigFiles() {
    try {
        console.log("Fetching configuration files...");

        const [cardTemplatesResponse, gameConfigResponse] = await Promise.all([
            fetch("./card-templates.json"), // Loads card templates
            fetch("./data/game-config.json") // Loads game settings
        ]);

        if (!cardTemplatesResponse.ok) throw new Error(`Failed to fetch card-templates.json: ${cardTemplatesResponse.status}`);
        if (!gameConfigResponse.ok) throw new Error(`Failed to fetch game-config.json: ${gameConfigResponse.status}`);

        cardTemplates = await cardTemplatesResponse.json();
        gameConfig = await gameConfigResponse.json();  

        if (!gameConfig || Object.keys(gameConfig).length === 0) {
            console.error("❌ ERROR: gameConfig is STILL EMPTY after loading!");
        }
    } catch (error) {
        console.error("❌ ERROR loading configuration files:", error);
    }
}

// ✅ Export everything needed by other files
export { cardTemplates, gameConfig, battleSystem, loadConfigFiles, loadJSON };