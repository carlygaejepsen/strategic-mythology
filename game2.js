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

let playerDeck = [];
let enemyDeck = [];
let playerHand = [];
let enemyHand = [];

const essenceEmojis = {
    "fire": "🔥",
    "water": "🌊",
    "air": "💨",
    "earth": "🏔️",
    "zap": "⚡",
    "love": "💞",
    "malice": "🩸",
    "hubris": "🦚",
    "wisdom": "📖",
    "light": "🕯️",
    "dark": "🌑",
    "vit": "🌿",
    "decay": "🍂",
    "luck": "🪙",
    "just": "⚖️",
	"insight": "🔮"
};

const classNames = {
    "mals": "Malevolent",
    "wilds": "Wildkeepers",
    "cares": "Caretakers",
    "heroes": "Heroes",
    "ecs": "Ecstatics",
    "warriors": "Warriors",
    "auth": "Authorities",
    "sages": "Sages",
    "mys": "Mystics",
    "oracles": "Oracles"
};

async function loadAllCards() {
    try {
        const characterFiles = [
            "./data/beast-chars.json", "./data/bully-chars.json", "./data/celestial-chars.json",
            "./data/hero-chars.json", "./data/life-chars.json", "./data/mystical-chars.json",
            "./data/olympian-chars.json", "./data/plant-chars.json", "./data/underworld-chars.json",
            "./data/water-chars.json"
        ];

        let characterDeck = (await Promise.all(characterFiles.map(loadJSON))).flat();
        let essenceDeck = await loadJSON("./data/essence-cards.json");
        let abilityDeck = await loadJSON("./data/ability-cards.json");

        let fullDeck = [...characterDeck, ...essenceDeck, ...abilityDeck];

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

function createCardElement(card, type) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("char-card");

    cardDiv.innerHTML = `
        <img src="${card.img}" alt="${card.name}" class="char-img">
        <h2 class="char-name">${card.name}</h2>
        ${type === "char" ? `
            <div class="char-stats">
                <p>❤️: ${card.hp} ⚔️: ${card.atk}🛡️: ${card.def} 🏇: ${card.spd}</p>
            </div>
            <div class="char-classes">
                ${card.classes.map(cls => `<span class="class-tag">${classNames[cls] || cls}</span>`).join("")}
            </div>
            <div class="char-essences">
                ${card.essences.map(ess => `<span class="essence ${ess}">${essenceEmojis[ess] || ess}</span>`).join("")}
            </div>
        ` : ""}
    `;

    return cardDiv;
}

function dealStartingHands() {
    playerHand = [];
    enemyHand = [];

    const playerContainer = document.getElementById("player-hand");
    const enemyContainer = document.getElementById("enemy-hand");

    playerContainer.innerHTML = "";
    enemyContainer.innerHTML = "";

    for (let i = 0; i < 5; i++) {
        if (playerDeck.length > 0) playerHand.push(playerDeck.pop());
        if (enemyDeck.length > 0) enemyHand.push(enemyDeck.pop());
    }

    playerHand.forEach(card => {
        playerContainer.appendChild(createCardElement(card, card.type));
    });

    enemyHand.forEach(card => {
        enemyContainer.appendChild(createCardElement(card, card.type));
    });

    setTimeout(addClickEventsToCards, 100);
}

function addClickEventsToCards() {
    document.querySelectorAll(".char-card").forEach(card => {
        card.addEventListener("click", () => {
            const battleZone = card.parentElement.id === "player-hand" 
                ? document.getElementById("player-battle-zone") 
                : document.getElementById("enemy-battle-zone");

            if (battleZone.contains(card)) return;
            battleZone.appendChild(card);
        });
    });
}

async function startGame() {
    await loadAllCards();
    dealStartingHands();
    addClickEventsToCards();
}

document.addEventListener("DOMContentLoaded", startGame);
document.getElementById("play-turn").addEventListener("click", () => {
    console.log("Turn played!");
});
