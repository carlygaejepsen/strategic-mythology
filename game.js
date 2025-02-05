// ============= GLOBAL VARIABLES =============
let player1Deck = [];
let player2Deck = [];
let player1Hand = [];
let player2Hand = [];
let player1BattleZone = [];
let player2BattleZone = [];
let allCards = [];
let currentPlayer;
let characters;
let actionCards;
let battleSystem;

const elementEmojis = {
    "fire": "🔥",
    "water": "💧",
    "air": "🌬️",
    "earth": "🌿",
    "electricity": "⚡",
    "love": "💖",
    "malice": "☠️",
    "hubris": "👑",
    "wisdom": "📖",
    "light": "🌟",
    "shadow": "🌑",
    "vitality": "🌱",
    "decay": "💀",
    "luck": "🍀",
    "justice": "⚖️"
};


// ============= HELPER FUNCTIONS =============
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');

// Name with Element Emoji (Smaller Font)
const nameElement = document.createElement('div');
nameElement.classList.add('card-name');

const nameText = document.createElement('span');
nameText.textContent = card.name;
nameText.classList.add('card-name-text'); // Add a class for font size

const elementEmojiSpan = document.createElement('span');
elementEmojiSpan.classList.add('card-elements'); // Add a CSS class for smaller font
if (card.element) {
    if (Array.isArray(card.element)) {
        elementEmojiSpan.textContent = " " + card.element.map(el => elementEmojis[el] || "").join(" ");
    } else {
        elementEmojiSpan.textContent = " " + (elementEmojis[card.element] || "");
    }
}

nameElement.appendChild(nameText);
nameElement.appendChild(elementEmojiSpan);
cardDiv.appendChild(nameElement);



    // Image
    if (card.image) {
        const imgElement = document.createElement('img');
        imgElement.src = card.image;
        imgElement.alt = card.name;
        imgElement.classList.add('card-image');
        cardDiv.appendChild(imgElement);
    }

    // Type & Attributes
    const attributesElement = document.createElement('div');
    attributesElement.classList.add('card-attributes');

    if (card.classes?.length > 0) {
        attributesElement.textContent += `${card.classes.join(', ')}`;
    }

    cardDiv.appendChild(attributesElement);

    // Stats
    if (card.hp || card.atk || card.def) {
        const statsElement = document.createElement('div');
        statsElement.classList.add('card-stats');
        statsElement.innerHTML = `❤️: ${card.hp || 0} ⚔️: ${card.atk || 0} 🛡️: ${card.def || 0}`;
        cardDiv.appendChild(statsElement);
    }

    // Description
    if (card.description) {
        const descriptionElement = document.createElement('div');
        descriptionElement.classList.add('card-description');
        descriptionElement.textContent = card.description;
        cardDiv.appendChild(descriptionElement);
    }

    return cardDiv;
}

function buildDeck() {
    const deck = [...allCards];

    // Include characters + all action cards (both element and class)
    const validDeck = deck.filter(card => 
        card.type === "character" || card.type === "action"
    );
console.log("Player 1 Hand:", player1Hand.map(c => `${c.name} [${c.type}/${c.subtype}]`));
console.log("Player 2 Hand:", player2Hand.map(c => `${c.name} [${c.type}/${c.subtype}]`));

    return shuffleDeck(validDeck);
}


function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function playCard(card, playerHand, playerBattleZone, battleZoneId) {
    const cardIndex = playerHand.indexOf(card);
    if (cardIndex !== -1) {
        playerHand.splice(cardIndex, 1);
        playerBattleZone.push(card);
        console.log(`Played card: ${card.name} into the battle zone.`);
        renderBattleZone(playerBattleZone, battleZoneId);
    } else {
        console.log("Card not found in hand!");
    }
}

function renderHand(hand, containerId, whichPlayer) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    hand.forEach((card) => {
        // Use createCardElement instead of basic div
        const cardElement = createCardElement(card); 
        
        cardElement.addEventListener('click', () => {
            if (whichPlayer === 'player1') {
                playCard(card, player1Hand, player1BattleZone, 'player1-battlezone');
            }
            renderHand(hand, containerId, whichPlayer);
        });

        container.appendChild(cardElement);
    });
}

function renderBattleZone(playerBattleZone, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id '${containerId}' not found.`);
        return;
    }

    container.innerHTML = '';
    playerBattleZone.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.textContent = card.name;
        container.appendChild(cardDiv);
    });
}

function handleTurn() {
    console.log(`Play Turn clicked. Current player is: ${currentPlayer}`);

    if (currentPlayer === 'player1') {
        console.log("Ending Player 1 turn; now it's Player 2's (AI) turn.");
        currentPlayer = 'player2';
        doAiMove();
        // Don't switch back here - let the AI take their full turn
    } else {
        console.log("Player 2 (AI) turn completed.");
        currentPlayer = 'player1';
    }
}
function doAiMove() {
    if (player2Hand.length === 0) {
        console.log("AI (Player 2) has no cards left to play.");
        return;
    }

    const randomIndex = Math.floor(Math.random() * player2Hand.length);
    const chosenCard = player2Hand[randomIndex];

    console.log(`AI (Player 2) chooses: ${chosenCard.name}`);

    playCard(chosenCard, player2Hand, player2BattleZone, 'player2-battlezone');
    renderHand(player2Hand, 'player2-hand', 'player2');
}


// ============= DATA LOADING =============

async function loadGameData() {
    try {
        const charactersResponse = await fetch("https://carlygaejepsen.github.io/strategic-mythology/data/character-cards.json");
                if (!charactersResponse.ok) throw new Error(`HTTP error! status: ${charactersResponse.status}`);
        const actionCardsResponse = await fetch("https://carlygaejepsen.github.io/strategic-mythology/data/action-cards.json");
                if (!actionCardsResponse.ok) throw new Error(`HTTP error! status: ${actionCardsResponse.status}`);
        const battleSystemResponse = await fetch("https://carlygaejepsen.github.io/strategic-mythology/data/battle-system.json");
            if (!battleSystemResponse.ok) throw new Error(`HTTP error! status: ${battleSystemResponse.status}`);
       
        
        characters = await charactersResponse.json();
        actionCards = await actionCardsResponse.json();
        battleSystem = await battleSystemResponse.json();

        // Combine all cards into allCards array
        allCards = [
            ...(Array.isArray(characters) ? characters : []),
            ...(Array.isArray(actionCards) ? actionCards : [])
        ];

        console.log("All loaded cards:", allCards); // Debugging check


         // Debug logging with null checks
        console.log("Total cards loaded:", allCards.length);
        console.log("Sample character:", allCards.find(c => c.type === "character"));
        console.log("Sample action:", allCards.find(c => c.subtype === "element"));

        
    } catch (error) {
        console.error("Critical loading error:", error);
        // Add error recovery or UI notification here
        throw error; // Re-throw to prevent game from starting with bad data
    }
}

// ============= INITIALIZE THE GAME =============

async function initGame() {
    player1Deck = [];
    player2Deck = [];
    player1Hand = [];
    player2Hand = [];
    player1BattleZone = [];
    player2BattleZone = [];
    currentPlayer = "player1";

    await loadGameData();

    player1Deck = buildDeck();
    player2Deck = buildDeck();

    player1Hand = player1Deck.splice(0, 5);
    player2Hand = player2Deck.splice(0, 5);

    console.log('Deck sizes:', player1Deck.length, player2Deck.length);
    console.log('Player 1 Hand:', player1Hand);
    console.log('Player 2 Hand:', player2Hand);

    renderHand(player1Hand, 'player1-hand', 'player1');
    renderHand(player2Hand, 'player2-hand', 'player2');

    const battleZoneEl = document.getElementById('battleZone');
    if (battleZoneEl) {
        battleZoneEl.innerHTML = '';
    }

    if (playTurnBtn) {
        playTurnBtn.disabled = false;
    }
}

// ============= EVENT LISTENERS =============

const startGameBtn = document.getElementById('start-game');
if (startGameBtn) {
    startGameBtn.addEventListener('click', initGame);
}

const playTurnBtn = document.getElementById('play-turn');
if (playTurnBtn) {
    playTurnBtn.addEventListener('click', handleTurn);
    playTurnBtn.disabled = true;
}

// Optional: initGame();
initGame();
