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

function logBattleEvent(message) {
    const logContainer = document.getElementById("results-log");
    if (!logContainer) {
        console.error("Results log container not found!");
        return;
    }

    // Create a new log entry
    const logEntry = document.createElement("div");
    logEntry.classList.add("log-entry");
    logEntry.textContent = message;

    // Append to the log container
    logContainer.appendChild(logEntry);

    // Auto-scroll to the latest message
    logContainer.scrollTop = logContainer.scrollHeight;
}


function playCard(card, playerHand, playerBattleZone, battleZoneId) {
    // If the battle zone is empty, allow any card to be played
    if (playerBattleZone.length === 0) {
        console.log(`Battle zone is empty. ${card.name} can be played freely.`);
    } else {
        // Check if the battle zone already contains this card type
        const hasSameType = playerBattleZone.some(existingCard => existingCard.type === card.type);
        const hasSameSubtype = playerBattleZone.some(existingCard => existingCard.subtype === card.subtype);

        // If it's a character card, enforce the matching rule
        if (card.type === "character") {
            const hasActionMatch = playerBattleZone.some(existingCard => {
                if (existingCard.type === "action") {
                    // Check if the character has a matching class with any class action card
                    const classMatch = existingCard.subtype === "class" &&
                        existingCard.classes.some(cls => card.classes.includes(cls));

                    // Check if the character has a matching element with any element action card
                    const elementMatch = existingCard.subtype === "element" &&
                        card.element.includes(existingCard.element);

                    return classMatch || elementMatch;
                }
                return false;
            });

            if (!hasActionMatch) {
                console.warn(`Cannot play ${card.name}. Must match an existing action card.`);
                return;
            }
        }

        // If it's an action card (element or class), ensure it connects to a character
        if (card.type === "action") {
            const hasCharacterMatch = playerBattleZone.some(existingCard => {
                if (existingCard.type === "character") {
                    // Check for a matching class (for class action cards)
                    const classMatch = card.subtype === "class" &&
                        existingCard.classes.some(cls => card.classes.includes(cls));

                    // Check for a matching element (for element action cards)
                    const elementMatch = card.subtype === "element" &&
                        existingCard.element.some(el => el === card.element);

                    return classMatch || elementMatch;
                }
                return false;
            });

            if (!hasCharacterMatch) {
                console.warn(`Cannot play ${card.name}. No connecting god shares a matching class or element.`);
                return;
            }
        }
    }

    // Prevent more than 3 cards in the battle zone
    if (playerBattleZone.length >= 3) {
        console.warn("Battle zone is full! Cannot play more than 3 cards.");
        return;
    }

    // Remove the card from hand and add it to the battle zone
    const cardIndex = playerHand.indexOf(card);
    if (cardIndex !== -1) {
        playerHand.splice(cardIndex, 1);
        playerBattleZone.push(card);
       logBattleEvent(`Player played ${card.name}!`);
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
        const miniCardDiv = document.createElement('div');
        miniCardDiv.classList.add('mini-card');

        // Card Name
        const nameElement = document.createElement('div');
        nameElement.classList.add('mini-card-name');
        nameElement.textContent = card.name;
        miniCardDiv.appendChild(nameElement);

        // Card Image (if available)
        if (card.image) {
            const imgElement = document.createElement('img');
            imgElement.src = card.image;
            imgElement.alt = card.name;
            imgElement.classList.add('mini-card-image');
            miniCardDiv.appendChild(imgElement);
        }

        // Display Elements (if available)
        if (card.element) {
            // Handle both single elements (strings) and arrays
            const elements = Array.isArray(card.element) ? card.element : [card.element];
            const elementIcons = elements.map(el => elementEmojis[el] || "").join(" ");
            const elementElement = document.createElement('div');
            elementElement.classList.add('mini-card-elements');
            elementElement.textContent = `🌟 ${elementIcons}`;
            miniCardDiv.appendChild(elementElement);
        }

        // Display Classes (if available)
        if (card.classes?.length > 0) {
            const classElement = document.createElement('div');
            classElement.classList.add('mini-card-classes');
            classElement.textContent = `🏛️ ${card.classes.join(', ')}`;
            miniCardDiv.appendChild(classElement);
        }

        // Display Stats (HP, ATK, DEF)
        if (card.hp || card.atk || card.def) {
            const statsElement = document.createElement('div');
            statsElement.classList.add('mini-card-stats');
            statsElement.innerHTML = `❤️: ${card.hp || 0} ⚔️: ${card.atk || 0} 🛡️: ${card.def || 0}`;
            miniCardDiv.appendChild(statsElement);
        }

        container.appendChild(miniCardDiv);
    });
}

function createMiniCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('mini-card');

    // Name (smaller font)
    const nameElement = document.createElement('div');
    nameElement.classList.add('mini-card-name');
    nameElement.textContent = card.name;
    cardDiv.appendChild(nameElement);

    // Image (scaled-down)
    if (card.image) {
        const imgElement = document.createElement('img');
        imgElement.src = card.image;
        imgElement.alt = card.name;
        imgElement.classList.add('mini-card-image');
        cardDiv.appendChild(imgElement);
    }

    return cardDiv;
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

    let playableCards = player2Hand.filter(card => {
        if (player2BattleZone.length === 0) {
            return true; // If battle zone is empty, AI can play anything
        }

        if (card.type === "character") {
            // AI can only play a character if it matches an existing action card
            return player2BattleZone.some(existingCard =>
                existingCard.type === "action" &&
                ((existingCard.subtype === "element" && card.element.includes(existingCard.element)) ||
                 (existingCard.subtype === "class" && existingCard.classes.some(cls => card.classes.includes(cls))))
            );
        }

        if (card.type === "action") {
            // AI can only play an action card if it matches an existing character
            return player2BattleZone.some(existingCard =>
                existingCard.type === "character" &&
                ((card.subtype === "element" && existingCard.element.includes(card.element)) ||
                 (card.subtype === "class" && card.classes.some(cls => existingCard.classes.includes(cls))))
            );
        }

        return false;
    });

    if (playableCards.length === 0) {
        console.log("AI (Player 2) has no valid cards to play.");
        return;
    }

    // AI chooses a random playable card
    const chosenCard = playableCards[Math.floor(Math.random() * playableCards.length)];

    logBattleEvent(`AI played ${chosenCard.name}!`);

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
    try {
        console.log("Initializing game...");
        player1Deck = [];
        player2Deck = [];
        player1Hand = [];
        player2Hand = [];
        player1BattleZone = [];
        player2BattleZone = [];
        currentPlayer = "player1";

        await loadGameData(); // Ensure JSON data loads correctly

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
    } catch (error) {
        console.error("Error initializing game:", error);
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
