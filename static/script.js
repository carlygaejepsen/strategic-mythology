///// SECTION 1: DATA HANDLING & INITIALIZATION /////

// Global Variables
let player1Deck = [];
let player2Deck = [];
let player1Hand = [];
let player2Hand = [];
let player1DiscardPile = [];
let player2DiscardPile = [];
let selectedCardPlayer1 = { characterCard: null, actionCard: null, elementCard: null };
let selectedCardPlayer2 = { characterCard: null, actionCard: null, elementCard: null };
let characterCards = [];
let actionCards = [];
let elementCards = [];
let classMatchingRules = {};
let elementMultipliers = {};
let elementtatusEffects = {};

const HAND_SIZE = 5;
const MAX_TURNS = 20; // Optional rule to limit infinite battles

// Load external JSON files and store data in global variables
async function loadData() {
    try {
        const [cardResponse, battleResponse, characterResponse] = await Promise.all([
            fetch("https://carlygaejepsen.github.io/strategic-mythology/static/data.json"),
            fetch("https://carlygaejepsen.github.io/strategic-mythology/static/battle-system.json"),
            fetch("https://carlygaejepsen.github.io/strategic-mythology/static/character-cards.json")
        ]);
        
        if (!cardResponse.ok || !battleResponse.ok || !characterResponse.ok) {
            throw new Error("Failed to load one or more JSON files.");
        }
        
        const cardData = await cardResponse.json();
        const battleData = await battleResponse.json();
        const characterData = await characterResponse.json();

        return { cardData, battleData, characterData };
    } catch (error) {
        console.error("Error loading data:", error);
        throw error;
    }
}
        
        // Assign data to global variables
        actionCards = cardData.classAttacks;
        elementCards = cardData.elementAttacks;
        classMatchingRules = battleData.classMatchingRules;
        elementMultipliers = battleData.elementMultipliers;
        elementtatusEffects = battleData.elementtatusEffects;

        console.log("Game data successfully loaded.");
        initializeGame(); // Start game setup after loading data
     


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
    const characterCards = characterData; // Assuming characterData is an array of character cards
    const actionCards = cardData.actionCards; // Assuming actionCards are part of cardData
    const elementCards = cardData.elementCards; // Assuming elementCards are part of cardData

    // Shuffle and deal decks for both players
    const player1Deck = shuffleDeck([...characterCards, ...actionCards, ...elementCards]);
    const player2Deck = shuffleDeck([...characterCards, ...actionCards, ...elementCards]);

    const player1Hand = drawInitialHand(player1Deck);
    const player2Hand = drawInitialHand(player2Deck);

    // Reset selections and game state
    const selectedCardPlayer1 = { characterCard: null, actionCard: null, elementCard: null };
    const selectedCardPlayer2 = { characterCard: null, actionCard: null, elementCard: null };

    console.log("Game setup complete. Ready to begin.");
    console.log("Player 1 Hand:", player1Hand);
    console.log("Player 2 Hand:", player2Hand);

    // Return the game state if needed
    return { player1Deck, player2Deck, player1Hand, player2Hand, selectedCardPlayer1, selectedCardPlayer2 };
}
// Draw initial hand of cards from the deck
function drawInitialHand(deck) {
    if (!Array.isArray(deck) || deck.length === 0) {
        console.error("Error: Deck is empty or not initialized.");
        return [];
    }
    return deck.splice(0, HAND_SIZE);
}

// Event Listeners for UI Buttons
// Event Listeners for UI Buttons
document.addEventListener("DOMContentLoaded", () => {
    // Start Game Button
document.getElementById("start-game").addEventListener("click", async () => {
        try {
            // Fetch the data
            const { cardData, battleData, characterData } = await loadData();
            
            // Log the data to the console to verify it's working
            console.log("Card Data:", cardData);
            console.log("Battle Data:", battleData);
            console.log("Character Data:", characterData);

            // Initialize the game with the fetched data
            initializeGame(cardData, battleData, characterData);
        } catch (error) {
            console.error("Failed to load data:", error);
            // Display an error message to the user if needed
            alert("Failed to load game data. Please try again.");
        }
    });

    // Play Turn Button
    document.getElementById("play-turn").addEventListener("click", () => {
        console.log("Play Turn clicked");
        // Add your "play turn" logic here
    });

    // Reset Game Button
    document.getElementById("reset-game").addEventListener("click", () => {
        console.log("Reset Game clicked");
        initializeGame(); // Reset the game
    });
});
///// SECTION 2: CARD SELECTION & RENDERING /////
///// SECTION: CARD DISPLAY FORMATTING /////

// Function to generate the correct HTML structure for different card types
function formatCardHTML(card) {
    let cardHTML = `<img src="${card.image}" alt="${card.name}" class="card-image">
                    <h3>${card.name}</h3>
                    <p>Type: ${card.type}</p>`;
    
    if (card.type === "character") {
        cardHTML += `<p>Class: ${card.classes.join(", ")}</p>
                     <p>element: ${card.element.join(", ")}</p>
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
        cardElement.innerHTML = `
            <img src="${card.image}" alt="${card.name}" class="card-image">
            <h3>${card.name}</h3>
            <p>Type: ${card.type}</p>
            ${card.type === "character" ? `<p>HP: ${card.hp}, ATK: ${card.attack}, DEF: ${card.defense}, SPD: ${card.speed}</p>` : ""}
            ${card.type === "action" || card.type === "element" ? `<p>Effect: ${card.effect || "None"}</p>` : ""}
        `;
        
        cardElement.addEventListener("click", () => selectCard(playerId, card, index));
        container.appendChild(cardElement);
    });
}

// Function to allow player selection of cards
function selectCard(playerId, card, index) {
    const selectedCard = playerId === "player1" ? selectedCardPlayer1 : selectedCardPlayer2;
    
    if (card.type === "character") {
        selectedCard.characterCard = { card, index };
    } else if (card.type === "action") {
        selectedCard.actionCard = { card, index };
    } else if (card.type === "element") {
        selectedCard.elementCard = { card, index };
    }
    
    console.log(`${playerId} selected ${card.name} (${card.type})`);
    updatePlayButton();
    highlightSelectedCards(playerId);
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
        playButton.disabled = !isSelectionValid(selectedCardPlayer1);
    }
}

// Function to check if a character Card and Action Card share a class
function doClassesMatch(characterCard, actionCard) {
    return characterCard.classes.some(cls => actionCard.classes.includes(cls));
}

// Highlight selected cards in the player's hand
function highlightSelectedCards(playerId) {
    const container = document.getElementById(`${playerId}-cards`);
    if (!container) return;
    
    const cards = container.getelementByClassName("card");
    Array.from(cards).forEach((cardElement, index) => {
        cardElement.classList.remove("selected");
        if (index === selectedCardPlayer1.characterCard?.index || index === selectedCardPlayer1.actionCard?.index) {
            cardElement.classList.add("selected");
        }
    });
}

// AI selects a random valid card
function selectAICard() {
    const characterCard = player2Hand.find(card => card.type === "character");
    const actionCard = player2Hand.find(card => card.type === "action" && doClassesMatch(characterCard, card));
    const elementCard = player2Hand.find(card => card.type === "element");
    
    selectedCardPlayer2.characterCard = characterCard ? { card: characterCard, index: player2Hand.indexOf(characterCard) } : null;
    selectedCardPlayer2.actionCard = actionCard ? { card: actionCard, index: player2Hand.indexOf(actionCard) } : null;
    selectedCardPlayer2.elementCard = elementCard ? { card: elementCard, index: player2Hand.indexOf(elementCard) } : null;
    
    console.log("AI selected cards:", selectedCardPlayer2);
}
///// SECTION 3: BATTLE MECHANICS & RESOLUTION /////

// Function to play a turn when both players have selected their cards
function playTurn() {
    const player1characterCard = selectedCardPlayer1?.characterCard?.card;
    const player1ActionCard = selectedCardPlayer1?.actionCard?.card;
    const player1ElementCard = selectedCardPlayer1?.elementCard?.card;
    
    const player2characterCard = selectedCardPlayer2?.characterCard?.card;
    const player2ActionCard = selectedCardPlayer2?.actionCard?.card;
    const player2ElementCard = selectedCardPlayer2?.elementCard?.card;
    
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
    if (classMatchingRules[attacker.classes[0]]?.strongAgainst.includes(defender.classes[0])) {
        damage *= 1.25; // 25% bonus damage
    } else if (classMatchingRules[attacker.classes[0]]?.weakAgainst.includes(defender.classes[0])) {
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
    if (elementMultipliers[elementCard.element]) {
        damage *= elementMultipliers[elementCard.element];
    }
    
    targetCard.hp = Math.max(0, targetCard.hp - Math.round(damage));
    logResult(`${elementCard.name} deals ${Math.round(damage)} damage to ${targetCard.name}.`);
    
    // Apply status effect if applicable
    if (elementtatusEffects[elementCard.element]) {
        applyStatusEffect(targetCard, elementtatusEffects[elementCard.element]);
    }
}

// Function to manage defeated cards and draw new ones
function manageDecks(card1, action1, card2, action2) {
    if (card1.hp <= 0) player1DiscardPile.push(card1);
    if (card2.hp <= 0) player2DiscardPile.push(card2);
    if (action1) player1DiscardPile.push(action1);
    if (action2) player2DiscardPile.push(action2);
    
    if (player1Deck.length > 0) player1Hand.push(player1Deck.shift());
    if (player2Deck.length > 0) player2Hand.push(player2Deck.shift());
}

// Function to check if a player has lost
function checkGameOver() {
    if (player1Deck.length === 0 && player1Hand.length === 0) {
        alert("Player 2 wins! Player 1 has no more cards left.");
    } else if (player2Deck.length === 0 && player2Hand.length === 0) {
        alert("Player 1 wins! Player 2 has no more cards left.");
    }
}
///// SECTION 4: POST-BATTLE & GAME STATE MANAGEMENT /////

// Function to reset selections after each turn
function resetSelections() {
    selectedCardPlayer1 = { characterCard: null, actionCard: null, elementCard: null };
    selectedCardPlayer2 = { characterCard: null, actionCard: null, elementCard: null };

    const battleZone = document.getElementById("battle-zone");
    if (battleZone) battleZone.innerHTML = ""; // Clear battle zone display

    highlightSelectedCards("player1");
    highlightSelectedCards("player2");
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
    player1Deck = [];
    player2Deck = [];
    player1Hand = [];
    player2Hand = [];
    player1DiscardPile = [];
    player2DiscardPile = [];
    
    document.getElementById("player1-cards").innerHTML = "";
    document.getElementById("player2-cards").innerHTML = "";
    document.getElementById("results-log").innerHTML = "";
    document.getElementById("play-turn").disabled = true;
    
    console.log("Game has been reset.");
    loadData(); // Reload data and restart game
}
