async function loadJSON(file) {
    const response = await fetch(file);
    return response.json();
}
let characterCards = [];
let essenceCards = [];
let abilityCards = [];

async function loadAllCards() {
    try {
        // Load Character Cards from multiple files
        const characterFiles = [
            "./data/beast-chars.json", "./data/bully-chars.json", "./data/celestial-chars.json",
            "./data/hero-chars.json", "./data/life-chars.json", "./data/mystical-chars.json",
            "./data/olympian-chars.json", "./data/plant-chars.json", "./data/underworld-chars.json",
            "./data/water-chars.json"
        ];

        for (const file of characterFiles) {
            let data = await loadJSON(file);
            characterCards = characterCards.concat(data);
        }

        // Load Essence and Ability Cards
        essenceCards = await loadJSON("essence-cards.json");
        abilityCards = await loadJSON("ability-cards.json");

        console.log("All cards loaded successfully!");
        console.log("Character Cards:", characterCards);
        console.log("Essence Cards:", essenceCards);
        console.log("Ability Cards:", abilityCards);
    } catch (error) {
        console.error("Error loading cards:", error);
    }
}

// Call this when starting the game
document.getElementById("start-game").addEventListener("click", async () => {
    console.log("Loading cards...");
    await loadAllCards();
    console.log("Game Ready!");
});
