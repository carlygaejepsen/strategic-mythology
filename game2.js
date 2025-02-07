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
            "beast-chars.json", "bully-chars.json", "celestial-chars.json",
            "hero-chars.json", "life-chars.json", "mystical-chars.json",
            "olympian-chars.json", "plant-chars.json", "underworld-chars.json",
            "water-chars.json"
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
