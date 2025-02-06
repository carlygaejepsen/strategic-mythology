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
let selectedAttacker = null;
let currentBattlePhase = 'select-attacker';
let currentPhase = 'deploy';
let turnStep = 0

const elementEmojis = {
    "fire": "🔥",
    "water": "🌊",
    "air": "💨",
    "earth": "🏔️",
    "electricity": "⚡",
    "love": "💞",
    "malice": "🩸",
    "hubris": "🦚",
    "wisdom": "📖",
    "light": "🕯️",
    "shadow": "🌑",
    "vitality": "🌿",
    "decay": "🍂",
    "luck": "🪙",
    "justice": "⚖️"
};


// ============= HELPER FUNCTIONS =============

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

function enableHandInteraction(player) {
    const handId = player === 'player1' ? 'player1-hand' : 'player2-hand';
    const battleZoneId = player === 'player1' ? 'player1-battlezone' : 'player2-battlezone';
    
    document.getElementById(handId).querySelectorAll('.card').forEach(cardEl => {
        cardEl.style.cursor = 'pointer';
        cardEl.onclick = () => {
            const card = getCardFromElement(cardEl);
            playCard(card, 
                player === 'player1' ? player1Hand : player2Hand,
                player === 'player1' ? player1BattleZone : player2BattleZone,
                battleZoneId
            );
            if (player === 'player1') handleTurn(); // Progress after player deploy
        };
    });
}

async function doAiDeploy() {
    if (player2Hand.length > 0 && player2BattleZone.length < 3) {
        const playable = player2Hand.filter(card => validateCardPlay(card, player2BattleZone));
        
        if (playable.length > 0) {
            const card = playable[Math.floor(Math.random() * playable.length)];
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate AI delay
            playCard(card, player2Hand, player2BattleZone, 'player2-battlezone');
        } else {
            console.warn("AI has no playable cards.");
        }
    }
}

// ====== FIXED playCard FUNCTION ======
function playCard(card, playerHand, playerBattleZone, battleZoneId) {
    // Prevent more than 3 cards in the battle zone FIRST
    if (playerBattleZone.length >= 3) {
        console.warn("Battle zone is full! Cannot play more than 3 cards.");
        return;
    }

    // Validate card play if battle zone isn't empty
    if (playerBattleZone.length > 0) {
        const hasSameType = playerBattleZone.some(existingCard => existingCard.type === card.type);
        const hasSameSubtype = playerBattleZone.some(existingCard => existingCard.subtype === card.subtype);

        if (card.type === "character") {
            const hasActionMatch = playerBattleZone.some(existingCard => {
                if (existingCard.type === "action") {
                    const classMatch = existingCard.subtype === "class" &&
                        (existingCard.classes || []).some(cls => (card.classes || []).includes(cls));
                    const elementMatch = existingCard.subtype === "element" &&
                        (card.element || []).some(el => el === existingCard.element);
                    return classMatch || elementMatch;
                }
                return false;
            });

            if (!hasActionMatch) {
                console.warn(`Cannot play ${card.name}. Must match an existing action card.`);
                return;
            }
        }

        if (card.type === "action") {
            const hasCharacterMatch = playerBattleZone.some(existingCard => {
                if (existingCard.type === "character") {
                    const classMatch = card.subtype === "class" &&
                        (existingCard.classes || []).some(cls => (card.classes || []).includes(cls));
                    const elementMatch = card.subtype === "element" &&
                        (existingCard.element || []).some(el => card.element.includes(el));
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

    // Remove card from hand
    const cardIndex = playerHand.indexOf(card);
    if (cardIndex === -1) {
        console.log("Card not found in hand!");
        return;
    }
    playerHand.splice(cardIndex, 1);

    // Add to battle zone
    playerBattleZone.push(card);
    
    // Handle healing
    if (card.healAmount) {
        const target = playerBattleZone.find(c => c.type === 'character');
        if (target) {
            target.hp = Math.min(100, target.hp + card.healAmount);
            logBattleEvent(`${card.name} healed ${target.name} for ${card.healAmount} HP!`);
        }
    }

    logBattleEvent(`Player played ${card.name}!`);
    renderBattleZone(playerBattleZone, battleZoneId);
    renderHand(playerHand, playerHand === player1Hand ? 'player1-hand' : 'player2-hand', playerHand === player1Hand ? 'player1' : 'player2');
}

function renderHand(hand, containerId, whichPlayer) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const newContainer = document.createElement('div');
    newContainer.id = containerId;
    newContainer.className = container.className;

    hand.forEach((card) => {
        const cardElement = createCardElement(card);
        
        if (whichPlayer === 'player1') {
            cardElement.addEventListener('click', () => {
                playCard(card, player1Hand, player1BattleZone, 'player1-battlezone');
                renderHand(player1Hand, containerId, whichPlayer);
            });
        }

        newContainer.appendChild(cardElement);
    });

    container.replaceWith(newContainer);
}


function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');

    // Name with Element Emoji (Smaller Font)
    const nameElement = document.createElement('div');
    nameElement.classList.add('card-name');

    const nameText = document.createElement('span');
    nameText.textContent = card.name;
    nameText.classList.add('card-name-text');

    const elementEmojiSpan = document.createElement('span');
    elementEmojiSpan.classList.add('card-elements');
    if (card.element) {
        if (Array.isArray(card.element)) {
            elementEmojiSpan.textContent = " " + card.element.map(el => elementEmojis[el] || "").filter(Boolean).join(" ");
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
        attributesElement.textContent = `${card.classes.join(', ')}`;
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

function renderBattleZone(playerBattleZone, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id '${containerId}' not found.`);
        return;
    }

    container.innerHTML = '';
    playerBattleZone.forEach(card => {
        const miniCard = document.createElement('div');
        miniCard.classList.add('mini-card');

        // Card Name
        const nameElement = document.createElement('div');
        nameElement.classList.add('mini-card-name');
        nameElement.textContent = card.name;
        miniCard.appendChild(nameElement);

        // Card Image (if available)
        if (card.image) {
            const imgElement = document.createElement('img');
            imgElement.src = card.image;
            imgElement.alt = card.name;
            imgElement.classList.add('mini-card-image');
            miniCard.appendChild(imgElement);
        }

        // Display Elements (if available)
        if (card.element) {
            const elements = Array.isArray(card.element) ? card.element : [card.element];
            const elementIcons = elements.map(el => elementEmojis[el] || "").filter(Boolean).join(" ");
            const elementElement = document.createElement('div');
            elementElement.classList.add('mini-card-elements');
            elementElement.textContent = `${elementIcons}`;
            miniCard.appendChild(elementElement);
        }

        // Display Classes (if available)
        if (card.classes?.length > 0) {
            const classElement = document.createElement('div');
            classElement.classList.add('mini-card-classes');
            classElement.textContent = `${card.classes.join(', ')}`;
            miniCard.appendChild(classElement);
        }

        // Display Stats (HP, ATK, DEF)
        if (card.hp || card.atk || card.def) {
            const statsElement = document.createElement('div');
            statsElement.classList.add('mini-card-stats');
            statsElement.innerHTML = `❤️: ${card.hp || 0} ⚔️: ${card.atk || 0} 🛡️: ${card.def || 0}`;
            miniCard.appendChild(statsElement);
        }

        container.appendChild(miniCard);
    });
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

// ============= BATTLE SYSTEM =============
function initAttackSystem() {
    selectedAttacker = null;
    currentBattlePhase = 'select-attacker';
    addBattleZoneListeners();
}

function addBattleZoneListeners() {
    const battleZones = {
        'player1-battlezone': 'player1',
        'player2-battlezone': 'player2'
    };

    Object.entries(battleZones).forEach(([zoneId, player]) => {
        const zone = document.getElementById(zoneId);
        if (zone) {
            zone.querySelectorAll('.mini-card').forEach(cardEl => {
                cardEl.classList.add('selectable');
                cardEl.onclick = () => handleBattleSelection(cardEl, player);
            });
        }
    });
}

function handleBattleSelection(cardElement, player) {
    const card = getCardFromElement(cardElement);
    if (!card) return;

    if (currentBattlePhase === 'select-attacker' && player === currentPlayer) {
        if (card.atk > 0) {
            selectedAttacker = card;
            currentBattlePhase = 'select-defender';
            highlightValidTargets();
            logBattleEvent(`${card.name} selected as attacker. Choose target!`);
        }
    } else if (currentBattlePhase === 'select-defender' && player !== currentPlayer) {
        resolveCombat(selectedAttacker, card);
        cleanupBattleSelection();
    }
}

function resolveCombat(attacker, defender) {
    if (!attacker || !defender) return;
    let damage = Math.max(attacker.atk - defender.def, 0);
    damage += calculateElementBonus([attacker], [defender]);
    damage += calculateClassBonus([attacker], [defender]);
    defender.hp -= damage;
    logBattleEvent(`${attacker.name} attacks ${defender.name} for ${damage} damage!`);
    
    if (defender.hp <= 0) {
        removeDestroyedCard(defender);
        logBattleEvent(`${defender.name} was destroyed!`);
    }
    
    renderBattleZone(player1BattleZone, 'player1-battlezone');
    renderBattleZone(player2BattleZone, 'player2-battlezone');
}

function removeDestroyedCard(card) {
    const p1Index = player1BattleZone.indexOf(card);
    const p2Index = player2BattleZone.indexOf(card);
    
    if (p1Index !== -1) {
        player1BattleZone.splice(p1Index, 1);
        renderBattleZone(player1BattleZone, 'player1-battlezone');
    }
    if (p2Index !== -1) {
        player2BattleZone.splice(p2Index, 1);
        renderBattleZone(player2BattleZone, 'player2-battlezone');
    }
}

function highlightValidTargets() {
    const enemyZoneId = currentPlayer === 'player1' ? 'player2-battlezone' : 'player1-battlezone';
    const enemyZone = document.getElementById(enemyZoneId);
    if (enemyZone) {
        enemyZone.querySelectorAll('.mini-card').forEach(cardEl => {
            cardEl.classList.add('targetable');
        });
    }
}

function cleanupBattleSelection() {
    selectedAttacker = null;
    currentBattlePhase = 'select-attacker';
    document.querySelectorAll('.selectable, .targetable').forEach(el => {
        el.classList.remove('selectable', 'targetable');
    });
    addBattleZoneListeners();
}

function getCardFromElement(cardElement) {
    const nameElement = cardElement.querySelector('.mini-card-name');
    if (!nameElement) {
        console.error('Name element not found in card:', cardElement);
        return null;
    }
    const cardName = nameElement.textContent.trim();
    return [...player1BattleZone, ...player2BattleZone].find(card => card.name === cardName) || null;
}




// ============= WIN CONDITION CHECKING =============
function checkWinConditions() {
    if (player1BattleZone.length === 0 && player1Hand.length === 0 && player1Deck.length === 0) {
        endGame('player2');
    } else if (player2BattleZone.length === 0 && player2Hand.length === 0 && player2Deck.length === 0) {
        endGame('player1');
    }
}

// ============= UPDATED TURN HANDLING =============
async function handleTurn() {
    switch(currentPhase) {
        case 'deploy':
            await handleDeploymentPhase();
            break;
        case 'attack':
            await handleAttackPhase();
            break;
        case 'draw':
            handleDrawPhase();
            break;
    }
}

async function handleDeploymentPhase() {
    if (turnStep === 0) {
        logBattleEvent("Your turn: Play a card to battle zone");
        enableHandInteraction('player1');
        turnStep = 1;
    } else if (turnStep === 1) {
        await doAiDeploy();
        currentPhase = 'attack';
        turnStep = 0;
        handleTurn();
    }
}

async function handleAttackPhase() {
    if (turnStep === 0) {
        if (player1BattleZone.length > 0 && player2BattleZone.length > 0) {
            logBattleEvent("Select your attacker and target");
            initPlayerAttackSystem();
            turnStep = 1;
        } else {
            currentPhase = 'draw';
            handleTurn();
        }
    } else if (turnStep === 1) {
        if (player2BattleZone.length > 0 && player1BattleZone.length > 0) {
            await doAiAttack();
        }
        currentPhase = 'draw';
        turnStep = 0;
        handleTurn();
    }
}

function handleDrawPhase() {
    drawCard(player1Hand, player1Deck);
    drawCard(player2Hand, player2Deck);
    
    currentPhase = 'deploy';
    turnStep = 0;
    logBattleEvent("New turn starting...");
    handleTurn();
}

function initPlayerAttackSystem() {
    document.getElementById('player1-battlezone').querySelectorAll('.mini-card').forEach(cardEl => {
        const card = getCardFromElement(cardEl);
        if (card && card.atk > 0) {
            cardEl.classList.add('selectable');
            cardEl.onclick = () => handlePlayerAttackSelection(cardEl);
        }
    });
}

function handlePlayerAttackSelection(cardEl) {
    const attacker = getCardFromElement(cardEl);
    if (!attacker) return;
    if (!selectedAttacker) {
        selectedAttacker = attacker;
        document.querySelectorAll('.selectable').forEach(el => el.classList.remove('selectable'));
        
        document.getElementById('player2-battlezone').querySelectorAll('.mini-card').forEach(targetEl => {
            const defender = getCardFromElement(targetEl);
            if (defender) {
                targetEl.classList.add('targetable');
                targetEl.onclick = () => {
                    resolveCombat(selectedAttacker, defender);
                    selectedAttacker = null;
                    document.querySelectorAll('.targetable').forEach(el => el.classList.remove('targetable'));
                    handleTurn();
                };
            }
        });
    }
}

// ============= CARD DRAWING =============
function drawCard(hand, deck) {
    if (deck.length > 0) {
        hand.push(deck.shift());
        renderHand(hand, hand === player1Hand ? 'player1-hand' : 'player2-hand', hand === player1Hand ? 'player1' : 'player2');
    }
}

// ============= AI ATTACK LOGIC =============
function doAiAttack() {
    const attackers = player2BattleZone.filter(c => c.atk > 0);
    if (attackers.length === 0) return;

    const attacker = attackers[Math.floor(Math.random() * attackers.length)];
    const targets = player1BattleZone.filter(c => c.hp > 0);
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    logBattleEvent(`AI attacks with ${attacker.name} targeting ${target.name}!`);
    resolveCombat(attacker, target);
    checkWinConditions();
}

// ============= DATA LOADING =============
async function loadGameData() {
    try {
        const [charactersResponse, actionCardsResponse, battleSystemResponse] = await Promise.all([
            fetch("https://carlygaejepsen.github.io/strategic-mythology/data/character-cards.json"),
            fetch("https://carlygaejepsen.github.io/strategic-mythology/data/action-cards.json"),
            fetch("https://carlygaejepsen.github.io/strategic-mythology/data/battle-system.json")
        ]);

        if (!charactersResponse.ok || !actionCardsResponse.ok || !battleSystemResponse.ok) {
            throw new Error("HTTP error! One or more files failed to load.");
        }

        characters = await charactersResponse.json();
        actionCards = await actionCardsResponse.json();
        battleSystem = await battleSystemResponse.json();

		allCards = [...(characters || []), ...(actionCards?.elementActions || []), ...(actionCards?.classActions || [])];
    } catch (error) {
        console.error("Critical loading error:", error);
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
        currentPhase = 'deploy';

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

        document.getElementById('player1-battlezone').innerHTML = '';
        document.getElementById('player2-battlezone').innerHTML = '';

        if (playTurnBtn) {
            playTurnBtn.disabled = false;
        }
    } catch (error) {
        console.error("Error initializing game:", error);
    }
    handleTurn();
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

initGame();
