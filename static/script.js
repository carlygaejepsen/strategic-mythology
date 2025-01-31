// 🚀 Load Core Game Data
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Loading Strategic Mythology...");

    // Show loading popup
    const loadingPopup = document.createElement("div");
    loadingPopup.id = "loading-popup";
    loadingPopup.innerHTML = `
        <h2>Loading Strategic Mythology...</h2>
        <div id="loading-screen"><h2>Loading...</h2></div>
    `;
    document.body.appendChild(loadingPopup);

    try {
        // Step 1: Fetch JSON files and additional assets simultaneously
        const [cardData, battleSystem, imagesLoaded] = await Promise.all([
            fetch("static/data.json").then(res => res.json()),
            fetch("static/battle-system.json").then(res => res.json()),
         
        ]);

        console.log("Game data successfully loaded.");

        // Step 2: Validate required fields
        if (!cardData || !Array.isArray(cardData.cards) || !battleSystem || !battleSystem.elementMultipliers) {
            throw new Error("Invalid JSON format: missing essential properties.");
        }

        // Step 3: Store globally for easy access
        window.gameData = {
            cards: processCardData(cardData.cards),  // Ensure processed cards are stored
            battleSystem: battleSystem
        };

        // Step 4: Remove loading popup and show Start Game popup
        document.body.removeChild(loadingPopup);
        showStartPopup();
    } catch (error) {
        console.error("Error loading game data:", error);
        document.getElementById("loading-screen").innerHTML = "<h2>Error loading game data. Please refresh.</h2>";
    }
});

// 🎮 Show Start Game Popup
function showStartPopup() {
    const startPopup = document.createElement("div");
    startPopup.id = "start-popup";
    startPopup.innerHTML = `
        <h2>Welcome to Strategic Mythology</h2>
        <button id="start-game">Start</button>
    `;
    document.body.appendChild(startPopup);

    document.getElementById("start-game").addEventListener("click", () => {
        console.log("Start button clicked!");
        document.body.removeChild(startPopup);
    });
}

// 🎴 Define and Validate Cards Before Creating Decks
function processCardData(rawCards) {
    return rawCards.map(card => ({
        name: card.name || "Unknown",
        type: card.type || "unknown",
        classes: card.classes || [], // Default to empty array if missing
        elements: card.elements || [], // Default to empty array
        hp: card.hp ?? (card.type === "god" ? 100 : 0), // Gods have HP, others may not
        attack: card.attack ?? (card.type === "god" ? 10 : 5), // Set attack values
        defense: card.defense ?? (card.type === "god" ? 5 : 0), // Default defense if missing
        speed: card.speed ?? 10, // Default speed value
        effect: card.effect || null, // Some cards have unique effects
        image: card.image || "images/default-card.png", // Placeholder if no image is given
        description: card.description || "No description available", // Ensure descriptions are included
        power: card.power ?? 0, // Default power value for class attack cards
        specialAttack: card.specialAttack ? {
            name: card.specialAttack.name || "Unknown Special Attack",
            power: card.specialAttack.power ?? 0,
            effect: card.specialAttack.effect || "No effect",
            image: card.specialAttack.image || "images/default-special.png"
        } : null,
        ultraAttack: card.ultraAttack ? {
            name: card.ultraAttack.name || "Unknown Ultra Attack",
            power: card.ultraAttack.power ?? 0,
            effect: card.ultraAttack.effect || "No effect",
            image: card.ultraAttack.image || "images/default-ultra.png",
            ultraUser: card.ultraAttack.ultraUser || "Unknown"
        } : null,
        elementalAttack: card.element ? {
            element: card.element || "Unknown",
            damage: card.damage ?? 0,
            effect: card.effect || "No effect",
            speed: card.speed ?? 10,
            image: card.image || "images/default-elemental.png",
            description: card.description || "No description available"
        } : null
    }));
}

// 🎮 Initialize Game (Now ensuring cards are structured first)
function initializeGame() {
    console.log("Initializing game...");

    // Step 1: Validate and Structure Cards
    if (!window.gameData || !Array.isArray(window.gameData.cards) || window.gameData.cards.length === 0) {
        console.error("Error: Card data is missing or invalid. Cannot initialize player decks.");
        return;
    }

    console.log("Processing card data...");
    const structuredCards = processCardData(window.gameData.cards);

    // Step 2: Create Player Decks
    window.player1 = createPlayerDeck(structuredCards);
    window.player2 = createPlayerDeck(structuredCards);

    console.log("Player decks created and shuffled.");
}

// 🃏 Create Player Deck
function createPlayerDeck(cards) {
    const deck = [...cards]; // Clone structured card list to prevent modifying original data
    return {
        deck: shuffleDeck(deck),
        hand: [],
        discardPile: []
    };
}

// 🔄 Shuffle Deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 🃏 Draw Initial Hands for Players
function drawInitialHands() {
    console.log("Drawing initial hands...");

    window.player1.hand = drawCards(window.player1.deck, 5);
    window.player2.hand = drawCards(window.player2.deck, 5);

    console.log("Initial hands drawn.");
    updateUI();
}

// 🃏 Draw a Set Number of Cards from a Deck
function drawCards(deck, numCards) {
    if (!deck || deck.length === 0) {
        console.error("Deck is empty. No cards can be drawn.");
        return [];
    }

    let drawnCards = [];
    for (let i = 0; i < numCards && deck.length > 0; i++) {
        drawnCards.push(deck.shift()); // Take from the top of the deck
    }
    return drawnCards;
}

// 🎮 Update Game UI After Drawing Hands
function updateUI() {
    console.log("Updating game UI...");
    displayPlayerHand("player1", window.player1.hand);
    displayPlayerHand("player2", window.player2.hand);
}

// 🎴 Display Player's Hand in UI
function displayPlayerHand(playerId, hand) {
    const handContainer = document.getElementById(`${playerId}-hand`);
    if (!handContainer) {
        console.error(`Hand container for ${playerId} not found.`);
        return;
    }

    handContainer.innerHTML = ""; // Clear previous hand display

    hand.forEach((card, index) => {
        const cardElement = createCardElement(card);
        cardElement.addEventListener("click", () => selectCard(playerId, card, index));
        handContainer.appendChild(cardElement);
    });

    console.log(`${playerId} hand updated.`);
}

// 🎴 Create Card Element for UI Display
function createCardElement(card) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");

    cardElement.innerHTML = `
        <img src="${card.image}" alt="${card.name}">
        <h3>${card.name}</h3>
        <p>Type: ${card.type}</p>
        ${card.classes.length > 0 ? `<p>Classes: ${card.classes.join(", ")}</p>` : ""}
        ${card.elements.length > 0 ? `<p>Elements: ${card.elements.join(", ")}</p>` : ""}
        <p>HP: ${card.hp}</p>
        <p>ATK: ${card.attack}</p>
        <p>DEF: ${card.defense}</p>
        <p>SPD: ${card.speed}</p>
        ${card.effect ? `<p>Effect: ${card.effect}</p>` : ""}
    `;

    return cardElement;
}
// 🎮 Create Game UI Layout
function setupGameUI() {
    console.log("Setting up game UI...");

    // Create main game container
    const gameContainer = document.createElement("div");
    gameContainer.id = "game-container";
    gameContainer.innerHTML = `
        <div id="player1-area" class="player-area">
            <h2>Player 1</h2>
            <div id="player1-hand" class="hand"></div>
            <p>Deck: <span id="player1-deck-counter">${window.player1.deck.length}</span> cards</p>
            <p>Discard Pile: <span id="player1-discard-counter">${window.player1.discardPile.length}</span> cards</p>
        </div>

        <div id="battle-zone">
            <h2>Battle Zone</h2>
            <div id="battle-cards"></div>
        </div>

        <div id="player2-area" class="player-area">
            <h2>Player 2</h2>
            <div id="player2-hand" class="hand"></div>
            <p>Deck: <span id="player2-deck-counter">${window.player2.deck.length}</span> cards</p>
            <p>Discard Pile: <span id="player2-discard-counter">${window.player2.discardPile.length}</span> cards</p>
        </div>

        <button id="play-turn" disabled>Play Turn</button>

        <div id="results-log">
            <h2>Results Log</h2>
            <div id="log-messages"></div>
        </div>
    `;

    document.body.appendChild(gameContainer);
    console.log("Game UI setup complete.");

    updateUI();
}

// 🎮 Update UI Elements
function updateUI() {
    updatePlayerUI("player1");
    updatePlayerUI("player2");
}

// 🔄 Update Player UI (Hand, Deck, Discard)
function updatePlayerUI(playerId) {
    document.getElementById(`${playerId}-deck-counter`).textContent = window[playerId].deck.length;
    document.getElementById(`${playerId}-discard-counter`).textContent = window[playerId].discardPile.length;

    displayPlayerHand(playerId, window[playerId].hand);
}

// 📜 Log Battle Messages
function logMessage(message) {
    const logContainer = document.getElementById("log-messages");
    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);

    // Keep log to last 10 messages
    while (logContainer.children.length > 10) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

// 🏆 Enable/Disable "Play Turn" Button Based on Selections
function updatePlayButton() {
    const playButton = document.getElementById("play-turn");
    playButton.disabled = !(isSelectionValid("player1") && isSelectionValid("player2"));
}
// 🎴 Select a Card
function selectCard(playerId, cardIndex) {
    const player = window[playerId];
    const selectedCard = player.hand[cardIndex];

    if (!selectedCard) return;

    // Check if the card is already selected (Deselect if clicked again)
    if (selectedCard.selected) {
        selectedCard.selected = false;
        updatePlayerUI(playerId);
        updateBattleZone();
        updatePlayButton();
        return;
    }

    // Check selection limits
    if (selectedCard.type === "god" && player.selectedGod) {
        console.warn("Only one God card can be selected per turn.");
        return;
    }
    if (selectedCard.type === "action" && player.selectedAction) {
        console.warn("Only one Action card can be selected per turn.");
        return;
    }
    if (selectedCard.type === "element" && player.selectedElement) {
        console.warn("Only one Elemental card can be selected per turn.");
        return;
    }

    // Validate Class and Element Matching Rules
    if (selectedCard.type === "action" && player.selectedGod) {
        if (
            !player.selectedGod.classes.some(cls => selectedCard.classes.includes(cls)) &&
            !player.selectedGod.elements.some(el => selectedCard.elements.includes(el))
        ) {
            console.warn("Action card must match the class or element of the selected God.");
            return;
        }
    }

    // Select the card
    selectedCard.selected = true;
    if (selectedCard.type === "god") player.selectedGod = selectedCard;
    if (selectedCard.type === "action") player.selectedAction = selectedCard;
    if (selectedCard.type === "element") player.selectedElement = selectedCard;

    updatePlayerUI(playerId);
    updateBattleZone();
    updatePlayButton();
}

// 🎴 Update Battle Zone Display
function updateBattleZone() {
    const battleZone = document.getElementById("battle-cards");
    battleZone.innerHTML = "";

    ["player1", "player2"].forEach(playerId => {
        const player = window[playerId];
        if (player.selectedGod) battleZone.appendChild(createCardElement(player.selectedGod, playerId));
        if (player.selectedAction) battleZone.appendChild(createCardElement(player.selectedAction, playerId));
        if (player.selectedElement) battleZone.appendChild(createCardElement(player.selectedElement, playerId));
    });
}

// 🎴 Check if Selection is Valid
function isSelectionValid(playerId) {
    const player = window[playerId];
    return player.selectedGod || player.selectedAction || player.selectedElement;
}

// 🎴 Display Player's Hand with Clickable Cards
function displayPlayerHand(playerId, hand) {
    const handContainer = document.getElementById(`${playerId}-hand`);
    handContainer.innerHTML = "";

    hand.forEach((card, index) => {
        const cardElement = createCardElement(card, playerId, index);
        cardElement.addEventListener("click", () => selectCard(playerId, index));
        handContainer.appendChild(cardElement);
    });
}
