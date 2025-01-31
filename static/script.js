// 🚀 Load Core Game Data
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Loading Strategic Mythology...");

 
        const [cardData, battleSystem] = await Promise.all([
            fetch("static/data.json").then(res => res.json()),
            fetch("static/battle-system.json").then(res => res.json())
        ]);

        console.log("Game data loaded.");

        if (!cardData || !Array.isArray(cardData.cards) || !battleSystem) {
            throw new Error("Invalid JSON format.");
        }

        window.gameData = { cards: cardData.cards, battleSystem };
        showStartPopup();

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
        document.body.removeChild(startPopup);
        initializeGame();
    });
}

// 🎮 Initialize Game
function initializeGame() {
    console.log("Initializing game...");
    if (!window.gameData?.cards?.length) {
        console.error("No card data available.");
        return;
    }
    window.player1 = createPlayerDeck(window.gameData.cards);
    window.player2 = createPlayerDeck(window.gameData.cards);
    drawInitialHands();
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
    if (!handContainer) return;
    handContainer.innerHTML = hand.map(createCardElement).join("");
}

// 🎴 Create Card Element with Stats and Description
function createCardElement(card) {
    return `
        <div class="card">
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
        </div>
    `;
}
