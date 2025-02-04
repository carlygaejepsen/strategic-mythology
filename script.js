// =======================
// Game Data Initialization
// =======================

let characters = [];      // Will store character cards
let actionCards = [];     // Will store ALL action cards (elements + classes)
let battleLog = [];       // Track battle events
let playerHand = [];      // Cards in player's hand
let battlefield = [];     // Cards in play

// =======================
// Load Game Data
// =======================

async function loadGameData() {
  // Load characters
  const chars = await fetch('https://carlygaejepsen.github.io/strategic-mythology/data/character-cards.json');
  characters = await chars.json();
  
  // Load action cards (elements + classes)
  const actions = await fetch('https://carlygaejepsen.github.io/strategic-mythology/data/action-cards.json');
  actionCards = await actions.json();
  
  // Initialize game
  startGame();
}

// =======================
// Core Game Functions
// =======================

function startGame() {
  // Deal initial cards (3 characters + 2 random actions)
  playerHand = [
    ...characters.slice(0, 3),
    ...actionCards.sort(() => Math.random() - 0.5).slice(0, 2)
  ];
  
  renderGame();
}

function renderGame() {
  // Clear previous state
  document.getElementById('player-hand').innerHTML = '';
  document.getElementById('battlefield').innerHTML = '';

  // Render player hand
  playerHand.forEach(card => {
    const cardElement = createCardElement(card);
    cardElement.onclick = () => playCard(card);
    document.getElementById('player-hand').appendChild(cardElement);
  });

  // Render battlefield
  battlefield.forEach(card => {
    const cardElement = createCardElement(card);
    document.getElementById('battlefield').appendChild(cardElement);
  });
}

// =======================
// Card Interactions
// =======================

function playCard(card) {
  // Character cards go directly to battlefield
  if (!card.type) {
    battlefield.push(card);
    playerHand = playerHand.filter(c => c !== card);
    renderGame();
    return;
  }

  // Action cards need validation
  if (validateActionCard(card)) {
    battlefield.push(card);
    playerHand = playerHand.filter(c => c !== card);
    renderGame();
  }
}

function validateActionCard(actionCard) {
  // Check if we're mixing types
  const hasElements = battlefield.some(c => c.type === 'element');
  const hasClasses = battlefield.some(c => c.type === 'class');
  
  if (actionCard.type === 'element' && hasClasses) {
    alert("Can't mix elements and classes!");
    return false;
  }
  
  if (actionCard.type === 'class' && hasElements) {
    alert("Can't mix classes and elements!");
    return false;
  }

  // Find matching character
  const hasMatch = battlefield.some(character => {
    if (!character.classes) return false; // Only check characters
    
    return actionCard.type === 'element'
      ? character.elements.includes(actionCard.name)
      : character.classes.some(c => actionCard.classes.includes(c));
  });

  if (!hasMatch) {
    alert(`No matching ${actionCard.type} on battlefield!`);
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