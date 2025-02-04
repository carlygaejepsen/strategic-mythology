// ============= GLOBAL VARIABLES =============

let characters = {};
let actionCards = {};
let battleSystem = {};

let player1Deck = [];
let player2Deck = [];
let player1Hand = [];
let player2Hand = [];
let player1BattleZone = [];
let player2BattleZone = [];

// ============= HELPER FUNCTIONS =============

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

function playCard(card, playerHand, playerBattleZone) {
    const cardIndex = playerHand.indexOf(card);
    if (cardIndex !== -1) {
        playerHand.splice(cardIndex, 1);
        playerBattleZone.push(card);
        console.log(`Played card: ${card.name} into the battle zone.`);
    } else {
        console.log("Card not found in hand!");
    }
}

function renderHand(hand, containerId, whichPlayer = 'player1') {
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
                playCard(card, player1Hand, player1BattleZone);
                renderHand(player1Hand, 'player1-hand', 'player1');
                renderBattleZone(player1BattleZone, 'battle-zone');

            } else {
                playCard(card, player2Hand, player2BattleZone);
                renderHand(player2Hand, 'player2-hand', 'player2');
                renderBattleZone(player2BattleZone, 'battle-zone');
            }
        });

        container.appendChild(cardDiv);
    });
}

function renderBattleZone(battleZone, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id '${containerId}' not found.`);
        return;
    }

    container.innerHTML = '';
    battleZone.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.textContent = card.name;
        container.appendChild(cardDiv);
    });
}

function handleTurn() {
    console.log('Play Turn button clicked!');
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

    const battleZoneEl = document.getElementById('battle-zone');
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
