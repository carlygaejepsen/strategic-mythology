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

let characterDeck = [];
let essenceDeck = [];
let abilityDeck = [];
let playerHand = [];

async function loadAllCards() {
    try {
        const characterFiles = [
            "./data/beast-chars.json", "./data/bully-chars.json", "./data/celestial-chars.json",
            "./data/hero-chars.json", "./data/life-chars.json", "./data/mystical-chars.json",
            "./data/olympian-chars.json", "./data/plant-chars.json", "./data/underworld-chars.json",
            "./data/water-chars.json"
        ];

        characterDeck = (await Promise.all(characterFiles.map(loadJSON))).flat();
        essenceDeck = await loadJSON("./data/essence-cards.json");
        abilityDeck = await loadJSON("./data/ability-cards.json");

        characterDeck = shuffleDeck(characterDeck);
        essenceDeck = shuffleDeck(essenceDeck);
        abilityDeck = shuffleDeck(abilityDeck);

        console.log("All cards loaded successfully!");
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

function createCardElement(card, type) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add(`${type}-card`);
    cardDiv.innerHTML = `
        <img src="${card.img}" alt="${card.name}" class="${type}-img">
        <h2 class="${type}-name">${card.name}</h2>
        ${type === "char" ? `
            <div class="char-stats">
                <p>❤️ HP: ${card.hp}</p>
                <p>⚔️ ATK: ${card.atk}</p>
                <p>🛡️ DEF: ${card.def}</p>
                <p>💨 SPD: ${card.spd}</p>
            </div>
        ` : ""}
        ${type === "essence" ? `
            <div class="essence-type ${card.essence}">${card.essence.charAt(0).toUpperCase() + card.essence.slice(1)}</div>
            <div class="essence-stats">
                <p>❤️ HP: ${card.hp}</p>
                <p>⚔️ ATK: ${card.atk}</p>
            </div>
        ` : ""}
        ${type === "ability" ? `
            <div class="ability-classes">
                ${card.classes.map(cls => `<span class="class-tag">${cls}</span>`).join("")}
            </div>
            <div class="ability-stats">
                <p>❤️ HP: ${card.hp}</p>
                <p>⚔️ ATK: ${card.atk}</p>
            </div>
        ` : ""}
    `;
    return cardDiv;
}

function dealStartingHand() {
    playerHand = [];
    const container = document.getElementById("player-hand");
    container.innerHTML = "";
    
    if (characterDeck.length > 0) playerHand.push(characterDeck.pop());
    if (essenceDeck.length > 1) playerHand.push(essenceDeck.pop(), essenceDeck.pop());
    if (abilityDeck.length > 1) playerHand.push(abilityDeck.pop(), abilityDeck.pop());
    
    playerHand.forEach(card => {
        const type = card.type === "char" ? "character" : card.type;
        container.appendChild(createCardElement(card, type));
    });
}

function addClickEventsToCards() {
    document.querySelectorAll(".character-card, .essence-card, .ability-card").forEach(card => {
        card.addEventListener("click", () => {
            const battleZone = document.getElementById("battle-zone");
            if (battleZone.contains(card)) return;
            battleZone.appendChild(card);
        });
    });
}

async function startGame() {
    await loadAllCards();
    dealStartingHand();
    addClickEventsToCards();
}

document.addEventListener("DOMContentLoaded", startGame);

document.getElementById("play-turn").addEventListener("click", () => {
    console.log("Turn played!");
});
