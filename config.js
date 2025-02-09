let cardTemplates = {}; 
let gameConfig = {};  
let battleSystem = {};

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

        const [cardTemplatesResponse, gameConfigResponse, battleSystemResponse] = await Promise.all([
            fetch("./card-templates.json"),
            fetch("./data/game-config.json"),
            fetch("./data/bat-sys.json")
        ]);

        if (!cardTemplatesResponse.ok) throw new Error(`Failed to fetch card-templates.json`);
        if (!gameConfigResponse.ok) throw new Error(`Failed to fetch game-config.json`);
        if (!battleSystemResponse.ok) throw new Error(`Failed to fetch bat-sys.json`);

        cardTemplates = await cardTemplatesResponse.json();
        gameConfig = await gameConfigResponse.json();
        battleSystem = await battleSystemResponse.json();

        if (!gameConfig || Object.keys(gameConfig).length === 0) {
            console.error("❌ ERROR: gameConfig is STILL EMPTY after loading!");
        }
    } catch (error) {
        console.error("❌ ERROR loading configuration files:", error);
    }
}

// Export these variables and functions
export { cardTemplates, gameConfig, battleSystem, loadConfigFiles };
