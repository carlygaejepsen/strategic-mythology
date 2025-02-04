// ============= GLOBAL VARIABLES =============
let player1Deck = [];
let player2Deck = [];
let player1Hand = [];
let player2Hand = [];
let player1BattleZone = [];
let player2BattleZone = [];

// ============= HELPER FUNCTIONS =============
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    
    // Create the name element
    const nameElement = document.createElement('div');
    nameElement.classList.add('card-name');
    nameElement.textContent = card.name;
    cardDiv.appendChild(nameElement);
    
    // Create the image element
    if (card.image) {
        const imgElement = document.createElement('img');
        imgElement.src = card.image;
        imgElement.alt = card.name;
        imgElement.classList.add('card-image');
        cardDiv.appendChild(imgElement);
    }
    
    // Create the type and attributes line
    const attributesElement = document.createElement('div');
    attributesElement.classList.add('card-attributes');
    attributesElement.textContent = `[${card.type}]`;
    
    if (card.classes && card.classes.length > 0) {
        attributesElement.textContent += ` [${card.classes.join(', ')}]`;
    }
    if (card.element && card.element.length > 0) {
        attributesElement.textContent += ` [${card.element.join(', ')}]`;
    }
    
    cardDiv.appendChild(attributesElement);
    
    // Create the stats line
    const statsElement = document.createElement('div');
    statsElement.classList.add('card-stats');
    statsElement.innerHTML = `❤️: ${card.hp} ⚔️: ${card.attack} 🛡️: ${card.defense}`;
    cardDiv.appendChild(statsElement);
    
    // Create the description element
    const descriptionElement = document.createElement('div');
    descriptionElement.classList.add('card-description');
    descriptionElement.textContent = card.description;
    cardDiv.appendChild(descriptionElement);
    
    return cardDiv;
}

function buildDeck() {
    const deck = [];

    if (characters.characterCards) {
        deck.push(...characters.characterCards);
    }

    if (actionCards.elementActions) {
        deck.push(...actionCards.elementActions);
    }
    if (actionCards.classActions) {
        deck.push(...actionCards.classActions);
    }

    shuffleDeck(deck);
    return deck;
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
    if (!container) {
        console.error(`Container with id '${containerId}' not found.`);
        return;
    }

    container.innerHTML = '';
    hand.forEach((card) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.textContent = card.name || 'Unnamed Card';

        cardDiv.addEventListener('click', () => {
            if (whichPlayer === 'player1') {
                playCard(card, player1Hand, player1BattleZone, 'player1-battlezone');
            } else {
                playCard(card, player2Hand, player2BattleZone, 'player2-battlezone');
            }
            renderHand(hand, containerId, whichPlayer);
        });

        container.appendChild(cardDiv);
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
        currentPlayer = 'player1';
    } else {
        console.log("Player 2 (AI) turn triggered again.");
        doAiMove();
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
        const actionCardsResponse = await fetch("https://carlygaejepsen.github.io/strategic-mythology/data/action-cards.json");
        const battleSystemResponse = await fetch("https://carlygaejepsen.github.io/strategic-mythology/data/battle-system.json");

        characters = await charactersResponse.json();
        actionCards = await actionCardsResponse.json();
        battleSystem = await battleSystemResponse.json();

        console.log("Game data loaded successfully!");
    } catch (error) {
        console.error("Error loading game data:", error);
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
