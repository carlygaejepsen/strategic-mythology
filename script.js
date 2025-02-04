// =======================
// Game Data Initialization
// =======================

let allCards = [];        // Will store both character and action cards
let battleLog = [];       // Track battle events
let player1Hand = [];     // Cards in Player 1's hand
let player2Hand = [];     // Cards in Player 2's hand
let player1BattleZone = [];
let player2BattleZone = [];


// =======================
// Load Game Data
// =======================

async function loadGameData() {
    try {
        const charsResponse = await fetch('https://carlygaejepsen.github.io/strategic-mythology/data/character-cards.json');
        const actionsResponse = await fetch('https://carlygaejepsen.github.io/strategic-mythology/data/action-cards.json');
        
        const characters = await charsResponse.json();
        const actionCards = await actionsResponse.json();
        
        allCards = [...characters, ...actionCards]; // Combine both into one deck
        shuffleDeck(allCards);
        startGame();
    } catch (error) {
        console.error("Error loading game data:", error);
    }
}


// =======================
// Core Game Functions
// =======================

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function startGame() {
    // Deal initial hands randomly from the shuffled deck
    player1Hand = allCards.splice(0, 5);
    player2Hand = allCards.splice(0, 5);
    
    renderGame();
}

function renderGame() {
    // Clear previous state
    document.getElementById('player1-hand').innerHTML = '';
    document.getElementById('player2-hand').innerHTML = '';
    document.getElementById('player1BattleZone').innerHTML = '';
    document.getElementById('player2BattleZone').innerHTML = '';

    // Render Player 1's hand
    player1Hand.forEach(card => {
        const cardElement = createCardElement(card);
        cardElement.onclick = () => playCard(card, player1Hand, player1BattleZone, 'player1BattleZone');
        document.getElementById('player1-hand').appendChild(cardElement);
    });

    // Render Player 2's hand
    player2Hand.forEach(card => {
        const cardElement = createCardElement(card);
        cardElement.onclick = () => playCard(card, player2Hand, player2BattleZone, 'player2BattleZone');
        document.getElementById('player2-hand').appendChild(cardElement);
    });

      // Render Player 1's battle zone
    player1BattleZone.forEach(card => {
        const cardElement = createCardElement(card);
        document.getElementById('player1-battlezone').appendChild(cardElement);
    });

    // Render Player 2's battle zone
    player2BattleZone.forEach(card => {
        const cardElement = createCardElement(card);
        document.getElementById('player2-battlezone').appendChild(cardElement);
    });
}


// =======================
// Card Interactions
// =======================

function playCard(card, playerHand, playerBattleZone, battleZoneId) {
    if (!card.type) {
        playerBattleZone.push(card);
        playerHand.splice(playerHand.indexOf(card), 1);
        renderGame();
        return;
    }

    if (validateActionCard(card, playerBattleZone)) {
        playerBattleZone.push(card);
        playerHand.splice(playerHand.indexOf(card), 1);
        renderGame();
    }
}

function validateActionCard(actionCard, battleZone) {
    const hasElements = battleZone.some(c => c.type === 'element');
    const hasClasses = battleZone.some(c => c.type === 'class');
    
    if (actionCard.type === 'element' && hasClasses) {
        alert("Can't mix elements and classes!");
        return false;
    }

  // Find matching character
  const hasMatch = battleZone.some(character => {
    if (!character.classes) return false; // Only check characters
    
    return actionCard.type === 'element'
      ? character.elements.includes(actionCard.name)
      : character.classes.some(c => actionCard.classes.includes(c));
  });

  if (!hasMatch) {
    alert(`No matching ${actionCard.type} in battle zone!`);
    return false;
  }

  return true;
}

// =======================
// Helper Functions
// =======================

function createCardElement(card) {
  const div = document.createElement('div');
  div.className = `card ${card.type || 'character'}`;
  
  div.innerHTML = `
    <h3>${card.name}</h3>
    ${card.type ? `<p>Type: ${card.type}</p>` : ''}
    ${card.hp ? `<p>HP: ${card.hp}</p>` : ''}
    ${card.atk ? `<p>ATK: ${card.atk}</p>` : ''}
    ${card.classes ? `<p>Classes: ${card.classes.join(', ')}</p>` : ''}
    ${card.elements ? `<p>Elements: ${card.elements.join(', ')}</p>` : ''}
  `;

  return div;
}

// =======================
// Start the Game
// =======================
loadGameData();
