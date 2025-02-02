///// SECTION 1: GAME STATE & INITIALIZATION /////

// Game State
const gameState = {
    player1Deck: [],
    player2Deck: [],
    player1Hand: [],
    player2Hand: [],
    player1DiscardPile: [],
    player2DiscardPile: [],
    selectedCardPlayer1: { characterCard: null, actionCard: null, elementCard: null },
    selectedCardPlayer2: { characterCard: null, actionCard: null, elementCard: null },
    characterCards: [],
    actionCards: [],
    elementCards: [],
    classMatchingRules: {},
    elementMultipliers: {},
    elementStatusEffects: {},
    HAND_SIZE: 5,
    MAX_TURNS: 20,
};

// Load external JSON files and store data in game state
async function loadData() {
    try {
        const [cardResponse, battleResponse, characterResponse] = await Promise.all([
            fetch("https://carlygaejepsen.github.io/strategic-mythology/static/data.json"),
            fetch("https://carlygaejepsen.github.io/strategic-mythology/static/battle-system.json"),
            fetch("https://carlygaejepsen.github.io/strategic-mythology/static/character-cards.json"),
        ]);

        if (!cardResponse.ok || !battleResponse.ok || !characterResponse.ok) {
            throw new Error("Failed to load one or more JSON files.");
        }

        const cardData = await cardResponse.json();
        const battleData = await battleResponse.json();
        const characterData = await characterResponse.json();

        console.log("Game data successfully loaded.");

        // Assign data to game state
        gameState.classMatchingRules = battleData.classMatchingRules;
        gameState.elementMultipliers = battleData.elementMultipliers;
        gameState.elementStatusEffects = battleData.elementStatusEffects;

        initializeGame(cardData, battleData, characterData); // Start game setup after loading data
    } catch (error) {
        console.error("Error loading data:", error);
        alert("Failed to load game data. Please try again.");
    }
}

// Shuffle a deck of cards using Fisher-Yates algorithm
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Initialize the game
function initializeGame(cardData, battleData, characterData) {
    console.log("Initializing game...");

    // Extract the necessary data from the fetched JSON
    gameState.characterCards = characterData;
    gameState.actionCards = cardData.actionCards;
    gameState.elementCards = cardData.elementCards;

    // Shuffle and deal decks for both players
    gameState.player1Deck = shuffleDeck([...gameState.characterCards, ...gameState.actionCards, ...gameState.elementCards]);
    gameState.player2Deck = shuffleDeck([...gameState.characterCards, ...gameState.actionCards, ...gameState.elementCards]);

    gameState.player1Hand = drawInitialHand(gameState.player1Deck);
    gameState.player2Hand = drawInitialHand(gameState.player2Deck);

    // Reset selections and game state
    gameState.selectedCardPlayer1 = { characterCard: null, actionCard: null, elementCard: null };
    gameState.selectedCardPlayer2 = { characterCard: null, actionCard: null, elementCard: null };

    console.log("Game setup complete. Ready to begin.");
    console.log("Player 1 Hand:", gameState.player1Hand);
    console.log("Player 2 Hand:", gameState.player2Hand);

    // Render hands
    displayCards("player1", gameState.player1Hand);
    displayCards("player2", gameState.player2Hand);
}

// Draw initial hand of cards from the deck
function drawInitialHand(deck) {
    if (!Array.isArray(deck) || deck.length === 0) {
        console.error("Error: Deck is empty or not initialized.");
        return [];
    }
    return deck.splice(0, gameState.HAND_SIZE);
}

///// SECTION 2: CARD SELECTION & RENDERING /////

// Function to render a player's hand on the screen
function displayCards(playerId, hand) {
    const container = document.getElementById(`${playerId}-cards`);
    if (!container) {
        console.error(`Error: Element with id '${playerId}-cards' not found.`);
        return;
    }

    container.innerHTML = ""; // Clear previous cards

    hand.forEach((card, index) => {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");
        cardElement.innerHTML = formatCardHTML(card);
        cardElement.addEventListener("click", () => selectCard(playerId, card, index));
        container.appendChild(cardElement);
    });
}

// Function to generate the correct HTML structure for different card types
function formatCardHTML(card) {
    let cardHTML = `<img src="${card.image}" alt="${card.name}" class="card-image">
                    <h3>${card.name}</h3>
                    <p>Type: ${card.type}</p>`;

    if (card.type === "character") {
        cardHTML += `<p>Class: ${card.classes.join(", ")}</p>
                     <p>Element: ${card.element.join(", ")}</p>
                     <p>❤️ HP: ${card.hp} ⚔️ ATK: ${card.attack} 🛡️ DEF: ${card.defense} 🌪️ SPD: ${card.speed}</p>`;
    } else if (card.type === "action") {
        cardHTML += `<p>Effect: ${card.effect || "None"}</p>`;
        if (card.specialAttack) {
            cardHTML += `<p>Special Attack: ${card.specialAttack.name} - ${card.specialAttack.effect}</p>`;
        }
        if (card.ultraAttack) {
            cardHTML += `<p>Ultra Attack: ${card.ultraAttack.name} - ${card.ultraAttack.effect} (User: ${card.ultraAttack.ultraUser})</p>`;
        }
    } else if (card.type === "element") {
        cardHTML += `<p>Element: ${card.element.join(", ")}</p>
                     <p>⚔️ Damage: ${card.damage} 🛡️ Defense: ${card.defense}</p>
                     <p>${card.description}</p>`;
    }

    return cardHTML;
}

// Function to allow player selection of cards
function selectCard(playerId, card, index) {
    const selectedCard = playerId === "player1" ? gameState.selectedCardPlayer1 : gameState.selectedCardPlayer2;

    if (card.type === "character") {
        selectedCard.characterCard = { card, index };
    } else if (card.type === "action") {
        selectedCard.actionCard = { card, index };
    } else if (card.type === "element") {
        selectedCard.elementCard = { card, index };
    }

    console.log(`${playerId} selected ${card.name} (${card.type})`);
    updatePlayButton();
}

// Ensure a valid card combination is selected before enabling the play button
function isSelectionValid(selectedCard) {
    if (!selectedCard.characterCard) return false; // A character card must always be selected

    if (selectedCard.actionCard) {
        return doClassesMatch(selectedCard.characterCard.card, selectedCard.actionCard.card);
    }

    return true; // A character card alone is valid
}

function updatePlayButton() {
    const playButton = document.getElementById("play-turn");
    if (playButton) {
        playButton.disabled = !isSelectionValid(gameState.selectedCardPlayer1);
    }
}

// Function to check if a character Card and Action Card share a class
function doClassesMatch(characterCard, actionCard) {
    return characterCard.classes.some(cls => actionCard.classes.includes(cls));
}

///// SECTION 3: BATTLE MECHANICS & RESOLUTION /////

// Function to play a turn when both players have selected their cards
function playTurn() {
    const player1characterCard = gameState.selectedCardPlayer1?.characterCard?.card;
    const player1ActionCard = gameState.selectedCardPlayer1?.actionCard?.card;
    const player1ElementCard = gameState.selectedCardPlayer1?.elementCard?.card;

    const player2characterCard = gameState.selectedCardPlayer2?.characterCard?.card;
    const player2ActionCard = gameState.selectedCardPlayer2?.actionCard?.card;
    const player2ElementCard = gameState.selectedCardPlayer2?.elementCard?.card;

    if (!player1characterCard || !player2characterCard) {
        alert("Both players must select a character Card to proceed!");
        return;
    }

    // Apply action card effects
    if (player1ActionCard) applyActionEffect(player1ActionCard, player2characterCard);
    if (player2ActionCard) applyActionEffect(player2ActionCard, player1characterCard);

    // Apply elemental attack effects
    if (player1ElementCard) applyElementEffect(player1ElementCard, player2characterCard);
    if (player2ElementCard) applyElementEffect(player2ElementCard, player1characterCard);

    // Resolve the battle between the two Character Cards
    resolveBattle(player1characterCard, player2characterCard);

    // Handle post-battle actions
    manageDecks(player1characterCard, player1ActionCard, player2characterCard, player2ActionCard);
    checkGameOver();

    // Reset selections after turn
    resetSelections();
}

// Function to resolve the battle between two Character Cards
function resolveBattle(card1, card2) {
    console.log(`Resolving battle: ${card1.name} vs ${card2.name}`);
    let turn = 1;

    while (card1.hp > 0 && card2.hp > 0) {
        if (card1.speed >= card2.speed) {
            attack(card1, card2);
            if (card2.hp > 0) attack(card2, card1);
        } else {
            attack(card2, card1);
            if (card1.hp > 0) attack(card1, card2);
        }
        turn++;
    }

    if (card1.hp <= 0) logResult(`${card1.name} has been defeated!`);
    if (card2.hp <= 0) logResult(`${card2.name} has been defeated!`);
}

// Function to perform an attack
function attack(attacker, defender) {
    let damage = attacker.attack;

    // Apply class effectiveness multipliers
    if (gameState.classMatchingRules[attacker.classes[0]]?.strongAgainst.includes(defender.classes[0])) {
        damage *= 1.25; // 25% bonus damage
    } else if (gameState.classMatchingRules[attacker.classes[0]]?.weakAgainst.includes(defender.classes[0])) {
        damage *= 0.75; // 25% reduced damage
    }

    defender.hp = Math.max(0, defender.hp - Math.round(damage));
    logResult(`${attacker.name} attacks ${defender.name} for ${Math.round(damage)} damage.`);
}

// Function to apply an action card effect
function applyActionEffect(actionCard, targetCard) {
    if (!actionCard) return;

    logResult(`${actionCard.name} effect applied to ${targetCard.name}.`);
    if (actionCard.effect === "Boost Attack") targetCard.attack += 5;
    if (actionCard.effect === "Heal") targetCard.hp += 10;
}

// Function to apply an elemental attack effect
function applyElementEffect(elementCard, targetCard) {
    if (!elementCard) return;

    let damage = elementCard.damage;

    // Apply elemental effectiveness multipliers
    if (gameState.elementMultipliers[elementCard.element]) {
        damage *= gameState.elementMultipliers[elementCard.element];
    }

    targetCard.hp = Math.max(0, targetCard.hp - Math.round(damage));
    logResult(`${elementCard.name} deals ${Math.round(damage)} damage to ${targetCard.name}.`);

    // Apply status effect if applicable
    if (gameState.elementStatusEffects[elementCard.element]) {
        applyStatusEffect(targetCard, gameState.elementStatusEffects[elementCard.element]);
    }
}

// Function to manage defeated cards and draw new ones
function manageDecks(card1, action1, card2, action2) {
    if (card1.hp <= 0) gameState.player1DiscardPile.push(card1);
    if (card2.hp <= 0) gameState.player2DiscardPile.push(card2);
    if (action1) gameState.player1DiscardPile.push(action1);
    if (action2) gameState.player2DiscardPile.push(action2);

    if (gameState.player1Deck.length > 0) gameState.player1Hand.push(gameState.player1Deck.shift());
    if (gameState.player2Deck.length > 0) gameState.player2Hand.push(gameState.player2Deck.shift());

    // Update hands in the UI
    displayCards("player1", gameState.player1Hand);
    displayCards("player2", gameState.player2Hand);
}

// Function to check if a player has lost
function checkGameOver() {
    if (gameState.player1Deck.length === 0 && gameState.player1Hand.length === 0) {
        alert("Player 2 wins! Player 1 has no more cards left.");
    } else if (gameState.player2Deck.length === 0 && gameState.player2Hand.length === 0) {
        alert("Player 1 wins! Player 2 has no more cards left.");
    }
}

///// SECTION 4: POST-BATTLE & GAME STATE MANAGEMENT /////

// Function to reset selections after each turn
function resetSelections() {
    gameState.selectedCardPlayer1 = { characterCard: null, actionCard: null, elementCard: null };
    gameState.selectedCardPlayer2 = { characterCard: null, actionCard: null, elementCard: null };

    const battleZone = document.getElementById("battle-zone");
    if (battleZone) battleZone.innerHTML = ""; // Clear battle zone display
}

// Function to log battle results in the UI
function logResult(message) {
    const resultsLog = document.getElementById("results-log");
    if (!resultsLog) return;

    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    resultsLog.appendChild(logEntry);

    // Limit the log to the last 10 entries
    while (resultsLog.children.length > 10) {
        resultsLog.removeChild(resultsLog.firstChild);
    }

    resultsLog.scrollTop = resultsLog.scrollHeight; // Auto-scroll to latest log
}

// Function to fully reset the game
function resetGame() {
    gameState.player1Deck = [];
    gameState.player2Deck = [];
    gameState.player1Hand = [];
    gameState.player2Hand = [];
    gameState.player1DiscardPile = [];
    gameState.player2DiscardPile = [];

    document.getElementById("player1-cards").innerHTML = "";
    document.getElementById("player2-cards").innerHTML = "";
    document.getElementById("results-log").innerHTML = "";
    document.getElementById("play-turn").disabled = true;

    console.log("Game has been reset.");
    loadData(); // Reload data and restart game
}

///// SECTION 5: EVENT LISTENERS /////

document.addEventListener("DOMContentLoaded", () => {
    // Start Game Button
    document.getElementById("start-game").addEventListener("click", async () => {
        try {
            await loadData();
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    });

    // Play Turn Button
    document.getElementById("play-turn").addEventListener("click", playTurn);

    // Reset Game Button
    document.getElementById("reset-game").addEventListener("click", resetGame);
});
