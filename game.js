// ============= GLOBAL VARIABLES =============
let characters = {};
let actionCards = {};
let player1Deck = [];
let player2Deck = [];
let player1Hand = [];
let player2Hand = [];
let player1BattleZone = [];
let player2BattleZone = [];


// ============= HELPER FUNCTIONS ============= 
function buildDeck() {
  const deck = [];

  // If your `characters` variable is shaped like { "characterCards": [ ... ] },
  // push them into the deck array:
  if (characters.characterCards) {
    deck.push(...characters.characterCards);
  }

  // For your action cards, push both elementActions + classActions:
  if (actionCards.elementActions) {
    deck.push(...actionCards.elementActions);
  }
  if (actionCards.classActions) {
    deck.push(...actionCards.classActions);
  }

  // We could shuffle the deck here, or do it after returning
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
  // Find the card's index in the player's hand
  const cardIndex = playerHand.indexOf(card);
  
  // If we found the card, remove it from the hand
  if (cardIndex !== -1) {
    playerHand.splice(cardIndex, 1);
    // Add it to the battle zone
    playerBattleZone.push(card);
    console.log(`Played card: ${card.name} into the battle zone.`);
  } else {
    console.log("Card not found in hand!");
  }
}
function renderHand(hand, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  hand.forEach((card) => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');

    const cardName = document.createElement('h3');
    cardName.textContent = card.name;
    cardDiv.appendChild(cardName);

    container.appendChild(cardDiv);
  });
}


// ============= DATA LOADING ============= 
async function loadGameData() {
  // fetch your JSON here
  try {
    // We'll fill these in with real fetch paths soon!
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
  await loadGameData();
  player1Deck = buildDeck();
  player2Deck = buildDeck();
  
  //Draw initial cards
	player1Hand = player1Deck.splice(0, 5);
	player2Hand = player2Deck.splice(0, 5);

	console.log('Deck sizes:', player1Deck.length, player2Deck.length);
	console.log('Player 1 Hand:', player1Hand);
	console.log('Player 2 Hand:', player2Hand);
	
	renderHand(player1Hand, 'player1-hand');
	renderHand(player2Hand, 'player2-hand');

 if (player1Hand.length > 0) {
    const cardToPlay = player1Hand[0];
    playCard(cardToPlay, player1Hand, player1BattleZone);
    console.log("Player 1 Battle Zone:", player1BattleZone);
  }

}

initGame();
