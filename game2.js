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
        essenceCards = await loadJSON("./data/essence-cards.json");
        abilityCards = await loadJSON("./data/ability-cards.json");

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

const characters = [
    {"name": "Amphitrite", "id": "amph", "type": "char", "classes": ["cares", "wilds"], "essences": ["water", "vit"], "hp": 100, "atk": 20, "def": 5, "spd": 10, "img": "./data/imgs/amphitrite.png"},
    {"name": "Arethusa", "id": "arth", "type": "char", "classes": ["wilds", "cares"], "essences": ["water", "air"], "hp": 95, "atk": 17, "def": 7, "spd": 12, "img": "./data/imgs/arethusa.png"},
    {"name": "Oceanus", "id": "ocns", "type": "char", "classes": ["cares", "wilds"], "essences": ["water", "vit"], "hp": 95, "atk": 16, "def": 10, "spd": 6, "img": "./data/imgs/oceanus.png"},
    {"name": "Tethys", "id": "teth", "type": "char", "classes": ["cares", "auth"], "essences": ["water"], "hp": 105, "atk": 20, "def": 7, "spd": 9, "img": "./data/imgs/tethys.png"},
    {"name": "Triton", "id": "trtn", "type": "char", "classes": ["wilds", "auth"], "essences": ["water"], "hp": 110, "atk": 22, "def": 8, "spd": 9, "img": "./data/imgs/triton.png"}
];

function generateCharacterCards() {
    const container = document.getElementById("player-hand"); // Replace with your div ID

    characters.forEach(char => {
        const card = document.createElement("div");
        card.classList.add("character-card");

        card.innerHTML = `
            <img src="${char.img}" alt="${char.name}" class="char-img">
            <h2 class="char-name">${char.name}</h2>
            <div class="char-stats">
                <p>❤️ HP: ${char.hp}</p>
                <p>⚔️ ATK: ${char.atk}</p>
                <p>🛡️ DEF: ${char.def}</p>
                <p>💨 SPD: ${char.spd}</p>
            </div>
            <div class="char-classes">
                ${char.classes.map(cls => `<span class="class-tag">${cls}</span>`).join("")}
            </div>
            <div class="char-essences">
                ${char.essences.map(ess => `<span class="essence ${ess}">${ess}</span>`).join("")}
            </div>
        `;

        container.appendChild(card);
    });
}

// Run the function on game start
document.getElementById("start-game").addEventListener("click", generateCharacterCards);
const essences = [
    { "id": "fire", "name": "Burnt Offering", "type": "essence", "essence": "fire", "hp": 50, "atk": 10, "def": 0, "img": "./data/imgs/fire.png" },
    { "id": "water", "name": "Tidal Wave", "type": "essence", "essence": "water", "hp": 50, "atk": 10, "def": 0, "img": "./data/imgs/wave.png" },
    { "id": "air", "name": "Whirlwind", "type": "essence", "essence": "air", "hp": 50, "atk": 10, "def": 0, "img": "./data/imgs/wind.png" },
    { "id": "earth", "name": "Rockslide", "type": "essence", "essence": "earth", "hp": 50, "atk": 10, "def": 0, "img": "./data/imgs/rockslide.png" }
];

function generateEssenceCards() {
    const container = document.getElementById("player-hand"); // Change to the correct div ID

    essences.forEach(ess => {
        const card = document.createElement("div");
        card.classList.add("essence-card");

        card.innerHTML = `
            <img src="${ess.img}" alt="${ess.name}" class="essence-img">
            <h2 class="essence-name">${ess.name}</h2>
            <div class="essence-type ${ess.essence}">${ess.essence.charAt(0).toUpperCase() + ess.essence.slice(1)}</div>
            <div class="essence-stats">
                <p>❤️ HP: ${ess.hp}</p>
                <p>⚔️ ATK: ${ess.atk}</p>
            </div>
        `;

        container.appendChild(card);
    });
}
const abilities = [
    { "id": "athletics", "name": "Athletics", "type": "ability", "classes": ["wars", "heroes", "wilds"], "hp": 50, "atk": 10, "def": 0, "img": "./data/imgs/athletics.png" },
    { "id": "medicine", "name": "Medicine", "type": "ability", "classes": ["sages", "cares", "heroes"], "hp": 50, "atk": 0, "def": 0, "healAmount": 30, "img": "./data/imgs/medicine.png" }
];
const classNames = {
    "mals": "Malevolents",
    "wilds": "Wildkeepers",
    "cares": "Caretakers",
    "heroes": "Heroes",
    "ecs": "Ecstatics",
    "wars": "Warriors",
    "auth": "Authorities",
    "sages": "Sages",
    "mys": "Mystics",
    "oracles": "Oracles"
};

function generateAbilityCards() {
    const container = document.getElementById("player-hand"); // Adjust if needed

    abilities.forEach(ability => {
        const card = document.createElement("div");
        card.classList.add("ability-card");

        // Determine ability type color (healing, attack, defense)
        let abilityTypeClass = ability.atk > 0 ? "attack" : ability.healAmount > 0 ? "healing" : "defense";

        card.innerHTML = `
            <img src="${ability.img}" alt="${ability.name}" class="ability-img">
            <h2 class="ability-name">${ability.name}</h2>
            <div class="ability-type ${abilityTypeClass}">Ability</div>
            <div class="ability-classes">
                ${ability.classes.map(cls => `<span class="class-tag">${classNames[cls] || cls}</span>`).join("")}
            </div>
            <div class="ability-stats">
                <p>❤️ HP: ${ability.hp}</p>
                <p>⚔️ ATK: ${ability.atk}</p>
                <p>🛡️ DEF: ${ability.def}</p>
                ${ability.healAmount ? `<p>💚 Heal: ${ability.healAmount}</p>` : ""}
            </div>
        `;

        container.appendChild(card);
    });
}


// Run functions on game start
document.getElementById("start-game").addEventListener("click", generateAbilityCards);
document.getElementById("start-game").addEventListener("click", generateEssenceCards);
