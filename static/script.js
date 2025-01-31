// 🚀 Load Core Game Data
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Loading Strategic Mythology...");
  document.getElementById("start-game").addEventListener("click", () => {
        console.log("Start button clicked!");
        document.getElementById("start-popup").remove();
        initializeGame();
        const [cardData, battleSystem] = await Promise.all([
            fetch("static/data.json").then(res => res.json()),
            fetch("static/battle-system.json").then(res => res.json())

        console.log("Game data loaded.");
  
});

        window.gameData = { cards: cardData.cards, battleSystem };
        showStartPopup();
  
    }
});

document.head.insertAdjacentHTML("beforeend", `
    <style>
        #start-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            text-align: center;
        }
        .popup-content {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        #start-game {
            margin-top: 10px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            border: none;
            background-color: #007bff;
            color: white;
            border-radius: 5px;
        }
        #start-game:hover {
            background-color: #0056b3;
        }
    </style>
`);

// 🎮 Show Start Game Popup
function showStartPopup() {
    const startPopup = document.createElement("div");
    startPopup.id = "start-popup";
    startPopup.innerHTML = `
        <div class="popup-content">
            <h2>Welcome to Strategic Mythology</h2>
            <button id="start-game" type="button">Start</button>
        </div>
    `;
    document.body.appendChild(startPopup);

    document.getElementById("start-game").addEventListener("click", () => {
        console.log("Start button clicked!");
        document.body.removeChild(startPopup);
        initializeGame();
    });
})

// 🎮 Initialize Game
function initializeGame() {
    console.log("Initializing game...");

    if (!window.gameData?.cards?.length) {
        console.error("No card data available.");
        return;
    }

    console.log("Creating player decks...");
    window.player1 = createPlayerDeck(window.gameData.cards);
    window.player2 = createPlayerDeck(window.gameData.cards);

    drawInitialHands();

    console.log("Displaying hands in UI...");
    displayPlayerHand("player1", window.player1.hand);
    displayPlayerHand("player2", window.player2.hand);

    console.log("Game initialized successfully!");
}


// 🃏 Create Player Deck
function createPlayerDeck(cards) {
    return { deck: shuffleDeck([...cards]), hand: [] };
}

// 🔄 Shuffle Deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 🃏 Draw Initial Hands
function drawInitialHands() {
    window.player1.hand = drawCards(window.player1.deck, 5);
    window.player2.hand = drawCards(window.player2.deck, 5);
    updateUI();
}

// 🃏 Draw Cards
function drawCards(deck, numCards) {
    return deck.splice(0, numCards);
}

// 🎮 Update UI
function updateUI() {
    displayPlayerHand("player1", window.player1.hand);
    displayPlayerHand("player2", window.player2.hand);
}

// 🎴 Display Player's Hand
function displayPlayerHand(playerId, hand) {
    const handContainer = document.getElementById(`${playerId}-hand`);
    if (!handContainer) {
        console.error(`Hand container for ${playerId} not found.`);
        return;
    }

    handContainer.innerHTML = "";


    hand.forEach((card) => {
        console.log(`Adding card: ${card.name}`); // Debugging
        const cardElement = createCardElement(card);
        handContainer.appendChild(cardElement);
})

// 🎴 Create Card Element with Stats and Description
function createCardElement(card) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.innerHTML = `
        <img src="${card.image || 'images/default-card.png'}" alt="${card.name}">
        <h3>${card.name}</h3>
        <p>Type: ${card.type}</p>
        ${card.classes.length > 0 ? `<p>Classes: ${card.classes.join(", ")}</p>` : ""}
        ${card.elements.length > 0 ? `<p>Elements: ${card.elements.join(", ")}</p>` : ""}
        <p>HP: ${card.hp}</p>
        <p>ATK: ${card.attack}</p>
        <p>DEF: ${card.defense}</p>
        <p>SPD: ${card.speed}</p>
        ${card.effect ? `<p>Effect: ${card.effect}</p>` : ""}
        ${card.description ? `<p>${card.description}</p>` : ""}
    `;
    return cardElement;
}
