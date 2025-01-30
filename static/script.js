// 🚀 Strategic Mythology - Game Script
// Ensure all game data is loaded before allowing interaction

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Loading Strategic Mythology...");

    // Show loading screen
    const loadingScreen = document.createElement("div");
    loadingScreen.id = "loading-screen";
    loadingScreen.innerHTML = "<h2>Loading Strategic Mythology...</h2>";
    document.body.appendChild(loadingScreen);

    try {
        // Load JSON data
        const [cardData, battleSystem] = await Promise.all([
            fetch("data.json").then(res => res.json()),
            fetch("battle-system.json").then(res => res.json())
        ]);

        console.log("Data successfully loaded.");
        
        // Store data globally
        window.gameData = {
            cards: cardData,
            battleSystem: battleSystem
        };

        // Remove loading screen and show start button
        document.body.removeChild(loadingScreen);
        showStartPopup();
    } catch (error) {
        console.error("Error loading data:", error);
        loadingScreen.innerHTML = "<h2>Error loading game data. Please refresh.</h2>";
    }
});

// 🎮 Show Start Button Popup
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

// 🎴 Initialize Game
function initializeGame() {
    console.log("Game initialized!");

    // Create player decks
    window.player1 = createPlayerDeck();
    window.player2 = createPlayerDeck();

    // Draw initial hands
    window.player1.hand = drawInitialHand(window.player1.deck);
    window.player2.hand = drawInitialHand(window.player2.deck);

    // Render UI
    renderGameUI();
}

// 📜 Create Player Deck
function createPlayerDeck() {
    const deck = [...window.gameData.cards]; // Clone full card list
    return {
        deck: shuffleDeck(deck),
        hand: [],
        discardPile: []
    };
}

// 🔄 Shuffle Deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 🃏 Draw Initial Hand
function drawInitialHand(deck) {
    return deck.splice(0, 5); // Draw first 5 cards
}

// 🎮 Render Game UI
function renderGameUI() {
    const gameContainer = document.createElement("div");
    gameContainer.id = "game-container";
    gameContainer.innerHTML = `
        <div id="player1-area">
            <h2>Player 1</h2>
            <div id="player1-hand" class="hand"></div>
            <div id="player1-deck">Deck: ${window.player1.deck.length} cards</div>
        </div>

        <div id="battle-zone">
            <h2>Battle Zone</h2>
            <div id="battle-cards"></div>
        </div>

        <div id="player2-area">
            <h2>Player 2</h2>
            <div id="player2-hand" class="hand"></div>
            <div id="player2-deck">Deck: ${window.player2.deck.length} cards</div>
        </div>

        <button id="play-turn">Play Turn</button>
        <div id="results-log"></div>
    `;

    document.body.appendChild(gameContainer);
    updateHands();
}

// 🔄 Update Hands
function updateHands() {
    updateHand("player1", window.player1.hand);
    updateHand("player2", window.player2.hand);
}

// 🃏 Update Player Hand UI
function updateHand(player, hand) {
    const handContainer = document.getElementById(`${player}-hand`);
    handContainer.innerHTML = "";

    hand.forEach((card, index) => {
        const cardElement = createCardElement(card);
        cardElement.addEventListener("click", () => selectCard(player, card, index));
        handContainer.appendChild(cardElement);
    });
}

// 🎴 Create Card Element
function createCardElement(card) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");

    cardElement.innerHTML = `
        <img src="${card.image}" alt="${card.name}">
        <h3>${card.name}</h3>
        <p>Type: ${card.type}</p>
        ${card.classes ? `<p>Classes: ${card.classes.join(", ")}</p>` : ""}
        ${card.elements ? `<p>Elements: ${card.elements.join(", ")}</p>` : ""}
        ${card.hp ? `<p>HP: ${card.hp}</p>` : ""}
        ${card.attack ? `<p>ATK: ${card.attack}</p>` : ""}
        ${card.defense ? `<p>DEF: ${card.defense}</p>` : ""}
        ${card.speed ? `<p>SPD: ${card.speed}</p>` : ""}
        ${card.effect ? `<p>Effect: ${card.effect}</p>` : ""}
    `;

    return cardElement;
}
// 🎴 Select a Card
function selectCard(player, card, index) {
    const battleZone = document.getElementById("battle-cards");
    const playerHand = document.getElementById(`${player}-hand`);
    
    // If card is already in battle zone, deselect it
    if (card.selected) {
        card.selected = false;
        updateHands();
        return;
    }

    // Check if a god card is already selected
    const selectedGod = window[player].hand.find(c => c.selected && c.type === "god");

    // Check how many cards have been selected
    const selectedCards = window[player].hand.filter(c => c.selected);

    if (card.type === "god" && selectedGod) {
        console.warn("Only one God card can be played per turn.");
        return;
    }

    if (selectedCards.length >= 3) {
        console.warn("You can only play up to three cards per turn.");
        return;
    }

    // Select the card
    card.selected = true;

    // Move selected card to the battle zone visually
    const cardElement = createCardElement(card);
    battleZone.appendChild(cardElement);
}

// 🏆 Play Turn
function playTurn() {
    const battleZone = document.getElementById("battle-cards");

    // Get selected cards from both players
    const player1Selection = window.player1.hand.filter(card => card.selected);
    const player2Selection = window.player2.hand.filter(card => card.selected);

    if (player1Selection.length === 0 || player2Selection.length === 0) {
        console.warn("Both players must select at least one card.");
        return;
    }

    // Begin battle logic
    resolveBattle(player1Selection, player2Selection);
}

// ⚔️ Resolve Battle
function resolveBattle(player1Cards, player2Cards) {
    const battleLog = document.getElementById("results-log");
    battleLog.innerHTML = "";

    let player1God = player1Cards.find(card => card.type === "god");
    let player2God = player2Cards.find(card => card.type === "god");

    let player1Action = player1Cards.find(card => card.type === "action");
    let player2Action = player2Cards.find(card => card.type === "action");

    let player1Element = player1Cards.find(card => card.type === "element");
    let player2Element = player2Cards.find(card => card.type === "element");

    // If no God cards, action cards attack once and are discarded
    if (!player1God && player1Action) {
        applyActionEffect(player1Action, player2God || player2Action);
        window.player1.discardPile.push(player1Action);
    }

    if (!player2God && player2Action) {
        applyActionEffect(player2Action, player1God || player1Action);
        window.player2.discardPile.push(player2Action);
    }

    if (!player1God && !player2God) {
        logBattle("Both players only used action cards. The turn ends.");
        endTurn();
        return;
    }

    // Battle sequence
    while (player1God?.hp > 0 && player2God?.hp > 0) {
        if (player1God.speed >= player2God.speed) {
            attack(player1God, player2God, player1Action, player1Element);
            if (player2God.hp > 0) {
                attack(player2God, player1God, player2Action, player2Element);
            }
        } else {
            attack(player2God, player1God, player2Action, player2Element);
            if (player1God.hp > 0) {
                attack(player1God, player2God, player1Action, player1Element);
            }
        }
    }

    // Determine winner
    if (player1God.hp <= 0) {
        logBattle(`${player1God.name} has been defeated!`);
        window.player1.discardPile.push(player1God);
    } else {
        logBattle(`${player2God.name} has been defeated!`);
        window.player2.discardPile.push(player2God);
    }

    // Discard used action/element cards if not combined with a winning god
    if (player1Action && player1God.hp <= 0) window.player1.discardPile.push(player1Action);
    if (player2Action && player2God.hp <= 0) window.player2.discardPile.push(player2Action);
    if (player1Element && player1God.hp <= 0) window.player1.discardPile.push(player1Element);
    if (player2Element && player2God.hp <= 0) window.player2.discardPile.push(player2Element);

    endTurn();
}

// ⚡ Apply Action Card Effect
function applyActionEffect(actionCard, target) {
    if (!actionCard || !target) return;

    const effect = window.gameData.battleSystem.actionEffects[actionCard.name];

    if (!effect) {
        console.warn(`No effect found for action card: ${actionCard.name}`);
        return;
    }

    target.hp = Math.max(0, target.hp - effect.damage);
    logBattle(`${actionCard.name} deals ${effect.damage} damage to ${target.name}.`);

    if (effect.status && target.hp > 0) {
        target.status = effect.status;
        logBattle(`${target.name} is now affected by ${effect.status}.`);
    }
}

// ⚔️ Attack Sequence
function attack(attacker, defender, actionCard, elementCard) {
    let damage = attacker.attack - defender.defense;
    
    // Element-based multipliers
    if (elementCard) {
        const multiplier = window.gameData.battleSystem.elementMultipliers[elementCard.element][defender.elements[0]];
        damage *= multiplier;
        logBattle(`${attacker.name} uses ${elementCard.name} with ${multiplier}x multiplier!`);
    }

    // Action card boosts
    if (actionCard && actionCard.classes.some(cls => attacker.classes.includes(cls))) {
        damage *= 1.5; // 50% more damage
        logBattle(`${attacker.name} combines with ${actionCard.name} for an enhanced attack!`);
    }

    damage = Math.max(0, Math.round(damage));
    defender.hp = Math.max(0, defender.hp - damage);
    logBattle(`${attacker.name} attacks ${defender.name} for ${damage} damage!`);

    if (defender.hp <= 0) {
        logBattle(`${defender.name} has been defeated!`);
    }
}

// 📜 Log Battle Text
function logBattle(message) {
    const battleLog = document.getElementById("results-log");
    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    battleLog.appendChild(logEntry);
}

// 🔄 End Turn
function endTurn() {
    setTimeout(() => {
        showRoundResultPopup();
    }, 1000);
}

// 🎉 Show Round Result Popup
function showRoundResultPopup() {
    const popup = document.createElement("div");
    popup.id = "round-popup";
    popup.innerHTML = `
        <h2>Round Over!</h2>
        <button id="next-round">Next Round</button>
    `;
    document.body.appendChild(popup);

    document.getElementById("next-round").addEventListener("click", () => {
        document.body.removeChild(popup);
        startNewRound();
    });
}
// Ensure battle system data is loaded before executing any battle logic
function ensureBattleSystemLoaded() {
    if (!window.gameData || !window.gameData.battleSystem) {
        console.error("Battle system data is missing or not loaded!");
        return false;
    }
    return true;
}

// Select a card
function selectCard(playerId, card, index) {
    const container = document.getElementById(`${playerId}-cards`);
    if (!container) {
        console.error(`Error: Element with id "${playerId}-cards" not found.`);
        return;
    }

    const cardElements = container.getElementsByClassName("card");
    const selectedCardElement = cardElements[index];

    if (!selectedCardElement) {
        console.error("Error: Selected card element not found in DOM.");
        return;
    }

    if (playerId === "player1") {
        if (card.type === "god") {
            if (selectedCardPlayer1.godCard?.index === index) {
                selectedCardPlayer1.godCard = null;
                selectedCardElement.classList.remove("selected");
                updatePlayButton();
                return;
            }
            selectedCardPlayer1.godCard = { card, index };
            moveCardToCenter(selectedCardElement, "battle-zone");
        } else if (card.type === "action") {
            if (selectedCardPlayer1.actionCard?.index === index) {
                selectedCardPlayer1.actionCard = null;
                selectedCardElement.classList.remove("selected");
                updatePlayButton();
                return;
            }
            selectedCardPlayer1.actionCard = { card, index };
            moveCardToCenter(selectedCardElement, "battle-zone");
        }

        // Ensure Class Match if Both Are Selected
        if (selectedCardPlayer1.godCard && selectedCardPlayer1.actionCard) {
            if (!doClassesMatch(selectedCardPlayer1.godCard.card, selectedCardPlayer1.actionCard.card)) {
                alert("You can only combine god and action cards of the same class!");
                selectedCardPlayer1.actionCard = null;
                updatePlayButton();
                return;
            }
        }

        highlightSelectedCards("player1");
        updatePlayButton();
    }
}

// Play a single turn
function playTurn() {
    if (!ensureBattleSystemLoaded()) return;

    if (!selectedCardPlayer1.godCard && !selectedCardPlayer1.actionCard) {
        alert("Please select at least one card!");
        return;
    }

    const player1GodCard = selectedCardPlayer1?.godCard?.card;
    const player1ActionCard = selectedCardPlayer1?.actionCard?.card;
    const player2GodCard = selectAICard(player2Hand) || null;
    const player2ActionCard = selectedCardPlayer2?.actionCard?.card || null;

    if (player1GodCard && player1ActionCard) {
        const matchingClasses = player1GodCard.classes.filter(cls => player1ActionCard.classes.includes(cls));
        if (matchingClasses.length === 0) {
            alert("Player 1's god and action card classes do not match!");
            resetSelections();
            return;
        }
    }
    if (player2GodCard && player2ActionCard) {
        const matchingClasses = player2GodCard.classes.filter(cls => player2ActionCard.classes.includes(cls));
        if (matchingClasses.length === 0) {
            selectedCardPlayer2.actionCard = null;
        }
    }

    if (player1ActionCard) applyActionEffect(player1ActionCard, player2GodCard);
    if (player2ActionCard && player1GodCard) applyActionEffect(player2ActionCard, player1GodCard);

    if (player1GodCard && player2GodCard) {
        resolveBattle(player1GodCard, player2GodCard);
    }

    resetSelections();
    checkGameOver();
}

// Manage decks and discards after battle
function manageDecks(card1, action1, card2, action2) {
    if (!ensureBattleSystemLoaded()) return;

    if (card1 && card1.health > 0) {
        player1Deck.push(card1);
        if (action1) player1Deck.push(action1);
    } else {
        if (card1) player1DiscardPile.push(card1);
        if (action1) player1DiscardPile.push(action1);
    }

    if (card2 && card2.health > 0) {
        player2Deck.push(card2);
        if (action2) player2Deck.push(action2);
    } else {
        if (card2) player2DiscardPile.push(card2);
        if (action2) player2DiscardPile.push(action2);
    }

    if (!card1 && action1) player1DiscardPile.push(action1);
    if (!card2 && action2) player2DiscardPile.push(action2);

    if (player1Deck.length > 0) {
        player1Hand.push(player1Deck.shift());
    }
    if (player2Deck.length > 0) {
        player2Hand.push(player2Deck.shift());
    }
}

// Check if the game is over
function checkGameOver() {
    if (!ensureBattleSystemLoaded()) return;

    if (player1Deck.length === 0 && player1Hand.length === 0) {
        alert("Player 2 wins! Player 1 has no more cards left.");
    } else if (player2Deck.length === 0 && player2Hand.length === 0) {
        alert("Player 1 wins! Player 2 has no more cards left.");
    }
}

// Reset selections
function resetSelections() {
    selectedCardPlayer1 = { godCard: null, actionCard: null };
    selectedCardPlayer2 = { godCard: null, actionCard: null };

    const battleCenter = document.getElementById("battle-zone");
    if (battleCenter) battleCenter.innerHTML = "";

    highlightSelectedCards("player1");
    highlightSelectedCards("player2");
}

// Log results to the battle log
function logResult(message) {
    const resultsLog = document.getElementById("results-log");
    if (!resultsLog) return;
    
    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    resultsLog.appendChild(logEntry);

    while (resultsLog.children.length > 10) {
        resultsLog.removeChild(resultsLog.firstChild);
    }

    resultsLog.scrollTop = resultsLog.scrollHeight;
}

// Reset the game
function resetGame() {
    if (!ensureBattleSystemLoaded()) return;

    player1Deck = [];
    player2Deck = [];
    player1Hand = [];
    player2Hand = [];
    document.getElementById("player1-cards").innerHTML = "";
    document.getElementById("player2-cards").innerHTML = "";
    document.getElementById("results-log").innerHTML = "";
    document.getElementById("play-turn").disabled = true;
}
// Apply action card effects
function applyActionEffect(actionCard, targetCard) {
    if (!ensureBattleSystemLoaded()) return;
    if (!actionCard || !targetCard) return;

    const effects = window.gameData.battleSystem.actionEffects;
    const effect = effects[actionCard.name];

    if (effect) {
        logResult(`${actionCard.name} effect: ${effect.description}`);
        targetCard.health = Math.max(0, targetCard.health - effect.damage);
        if (effect.statusEffect) {
            targetCard.status = effect.statusEffect;
            logResult(`${targetCard.name} is now affected by ${effect.statusEffect}!`);
        }
    } else {
        console.warn(`Action card ${actionCard.name} has no defined effect.`);
    }
}

// Resolve battle between two God cards
function resolveBattle(card1, card2) {
    if (!ensureBattleSystemLoaded()) return;
    console.log(`Resolving battle: ${card1.name} vs ${card2.name}`);

    let turn = 1;
    while (card1.health > 0 && card2.health > 0) {
        if (card1.speed >= card2.speed) {
            attack(card1, card2);
            if (card2.health > 0) attack(card2, card1);
        } else {
            attack(card2, card1);
            if (card1.health > 0) attack(card1, card2);
        }
        turn++;
    }

    if (card1.health <= 0) {
        logResult(`${card1.name} has been defeated!`);
        showWinnerPopup(card2.name);
    } else if (card2.health <= 0) {
        logResult(`${card2.name} has been defeated!`);
        showWinnerPopup(card1.name);
    }
}

// Attack logic with class and element multipliers
function attack(attacker, defender) {
    if (!ensureBattleSystemLoaded()) return;

    let baseDamage = attacker.power;
    let damageMultiplier = 1;

    if (attacker.element && defender.element) {
        const elementMultipliers = window.gameData.battleSystem.elementMultipliers;
        if (elementMultipliers[attacker.element] && elementMultipliers[attacker.element].strongAgainst.includes(defender.element)) {
            damageMultiplier *= 1.5; // 50% bonus damage
        } else if (elementMultipliers[attacker.element].weakAgainst.includes(defender.element)) {
            damageMultiplier *= 0.75; // 25% reduced damage
        }
    }

    if (attacker.classes && defender.classes) {
        const classMultipliers = window.gameData.battleSystem.classMultipliers;
        attacker.classes.forEach(cls => {
            if (classMultipliers[cls] && classMultipliers[cls].strongAgainst.includes(defender.classes[0])) {
                damageMultiplier *= 1.3; // 30% bonus damage for class advantage
            }
        });
    }

    let finalDamage = Math.round(baseDamage * damageMultiplier - defender.defense);
    finalDamage = finalDamage < 0 ? 0 : finalDamage;
    defender.health = Math.max(0, defender.health - finalDamage);

    logResult(`${attacker.name} attacks ${defender.name} for ${finalDamage} damage.`);
}

// Show winner popup
function showWinnerPopup(winningCardName) {
    const popup = document.createElement("div");
    popup.classList.add("popup");
    popup.innerHTML = `
        <h2>${winningCardName} Wins!</h2>
        <button onclick="closePopupAndProceed()">Next Round</button>
    `;
    document.body.appendChild(popup);
}

// Close winner popup and start the next round
function closePopupAndProceed() {
    document.querySelector(".popup").remove();
    startNextRound();
}

// Start the next round
function startNextRound() {
    if (!ensureBattleSystemLoaded()) return;

    player1Hand = drawCards(player1Deck, 5);
    player2Hand = drawCards(player2Deck, 5);

    displayCards("player1", player1Hand);
    displayCards("player2", player2Hand);
}
// Apply action card effects
function applyActionEffect(actionCard, targetCard) {
    if (!ensureBattleSystemLoaded()) return;
    if (!actionCard || !targetCard) return;

    const effects = window.gameData.battleSystem.actionEffects;
    const effect = effects[actionCard.name];

    if (effect) {
        logResult(`${actionCard.name} effect: ${effect.description}`);
        targetCard.health = Math.max(0, targetCard.health - effect.damage);
        if (effect.statusEffect) {
            targetCard.status = effect.statusEffect;
            logResult(`${targetCard.name} is now affected by ${effect.statusEffect}!`);
        }
    } else {
        console.warn(`Action card ${actionCard.name} has no defined effect.`);
    }
}

// Resolve battle between two God cards
function resolveBattle(card1, card2) {
    if (!ensureBattleSystemLoaded()) return;
    console.log(`Resolving battle: ${card1.name} vs ${card2.name}`);

    let turn = 1;
    while (card1.health > 0 && card2.health > 0) {
        if (card1.speed >= card2.speed) {
            attack(card1, card2);
            if (card2.health > 0) attack(card2, card1);
        } else {
            attack(card2, card1);
            if (card1.health > 0) attack(card1, card2);
        }
        turn++;
    }

    if (card1.health <= 0) {
        logResult(`${card1.name} has been defeated!`);
        showWinnerPopup(card2.name);
    } else if (card2.health <= 0) {
        logResult(`${card2.name} has been defeated!`);
        showWinnerPopup(card1.name);
    }
}

// Attack logic with class and element multipliers
function attack(attacker, defender) {
    if (!ensureBattleSystemLoaded()) return;

    let baseDamage = attacker.power;
    let damageMultiplier = 1;

    if (attacker.element && defender.element) {
        const elementMultipliers = window.gameData.battleSystem.elementMultipliers;
        if (elementMultipliers[attacker.element] && elementMultipliers[attacker.element].strongAgainst.includes(defender.element)) {
            damageMultiplier *= 1.5; // 50% bonus damage
        } else if (elementMultipliers[attacker.element].weakAgainst.includes(defender.element)) {
            damageMultiplier *= 0.75; // 25% reduced damage
        }
    }

    if (attacker.classes && defender.classes) {
        const classMultipliers = window.gameData.battleSystem.classMultipliers;
        attacker.classes.forEach(cls => {
            if (classMultipliers[cls] && classMultipliers[cls].strongAgainst.includes(defender.classes[0])) {
                damageMultiplier *= 1.3; // 30% bonus damage for class advantage
            }
        });
    }

    let finalDamage = Math.round(baseDamage * damageMultiplier - defender.defense);
    finalDamage = finalDamage < 0 ? 0 : finalDamage;
    defender.health = Math.max(0, defender.health - finalDamage);

    logResult(`${attacker.name} attacks ${defender.name} for ${finalDamage} damage.`);
}

// Show winner popup
function showWinnerPopup(winningCardName) {
    const popup = document.createElement("div");
    popup.classList.add("popup");
    popup.innerHTML = `
        <h2>${winningCardName} Wins!</h2>
        <button onclick="closePopupAndProceed()">Next Round</button>
    `;
    document.body.appendChild(popup);
}

// Close winner popup and start the next round
function closePopupAndProceed() {
    document.querySelector(".popup").remove();
    startNextRound();
}

// Start the next round
function startNextRound() {
    if (!ensureBattleSystemLoaded()) return;

    player1Hand = drawCards(player1Deck, 5);
    player2Hand = drawCards(player2Deck, 5);

    displayCards("player1", player1Hand);
    displayCards("player2", player2Hand);
}
// Draw a set number of cards from a deck
function drawCards(deck, numCards) {
    if (!deck || deck.length === 0) {
        console.error("Deck is empty. No cards can be drawn.");
        return [];
    }

    let drawnCards = [];
    for (let i = 0; i < numCards && deck.length > 0; i++) {
        drawnCards.push(deck.shift()); // Take from the top of the deck
    }
    return drawnCards;
}

// Reset selections and clear battle zone
function resetSelections() {
    selectedCardPlayer1 = { godCard: null, actionCard: null };
    selectedCardPlayer2 = { godCard: null, actionCard: null };

    document.getElementById("battle-zone").innerHTML = "";
    highlightSelectedCards("player1");
    highlightSelectedCards("player2");
}

// Log battle results
function logResult(message) {
    const resultsLog = document.getElementById("results-log");
    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    resultsLog.appendChild(logEntry);

    // Limit log to 10 entries
    while (resultsLog.children.length > 10) {
        resultsLog.removeChild(resultsLog.firstChild);
    }

    resultsLog.scrollTop = resultsLog.scrollHeight;
}

// Check if the game is over
function checkGameOver() {
    if (player1Deck.length === 0 && player1Hand.length === 0) {
        showGameOverPopup("Player 2 wins! Player 1 has no more cards left.");
    } else if (player2Deck.length === 0 && player2Hand.length === 0) {
        showGameOverPopup("Player 1 wins! Player 2 has no more cards left.");
    }
}

// Display game over popup
function showGameOverPopup(message) {
    const popup = document.createElement("div");
    popup.classList.add("popup");
    popup.innerHTML = `
        <h2>${message}</h2>
        <button onclick="restartGame()">Restart Game</button>
    `;
    document.body.appendChild(popup);
}

// Restart game by resetting all data
function restartGame() {
    document.querySelector(".popup").remove();
    initializeGame();
}

// Ensure battle system JSON is fully loaded
function ensureBattleSystemLoaded() {
    if (!window.gameData || !window.gameData.battleSystem) {
        console.error("Battle system data is not loaded yet.");
        return false;
    }
    return true;
}

// Move selected card to battle zone
function moveCardToBattleZone(playerId, card, index) {
    const battleZone = document.getElementById("battle-zone");
    if (!battleZone) {
        console.error("Error: Battle zone not found.");
        return;
    }

    const cardElement = document.createElement("div");
    cardElement.classList.add("battle-card");
    cardElement.innerHTML = `
        <img src="${card.image}" alt="${card.name}">
        <h3>${card.name}</h3>
        <p>Type: ${card.type}</p>
        ${card.classes ? `<p>Classes: ${card.classes.join(", ")}</p>` : ""}
        ${card.element ? `<p>Element: ${card.element}</p>` : ""}
        <p>HP: ${card.health} | Pow: ${card.power} | Def: ${card.defense} | Spd: ${card.speed}</p>
        ${card.effect ? `<p>Effect: ${card.effect}</p>` : ""}
    `;

    battleZone.appendChild(cardElement);
}

// Handle player selection of a card
function selectCard(playerId, card, index) {
    if (!card) return;

    const container = document.getElementById(`${playerId}-cards`);
    const cardElements = container.getElementsByClassName("card");
    const selectedCardElement = cardElements[index];

    if (!selectedCardElement) {
        console.error("Error: Selected card element not found in DOM.");
        return;
    }

    if (playerId === "player1") {
        if (card.type === "god") {
            if (selectedCardPlayer1.godCard?.index === index) {
                selectedCardPlayer1.godCard = null;
                selectedCardElement.classList.remove("selected");
                updatePlayButton();
                return;
            }
            selectedCardPlayer1.godCard = { card, index };
            moveCardToBattleZone(playerId, card, index);
        } else if (card.type === "action") {
            if (selectedCardPlayer1.actionCard?.index === index) {
                selectedCardPlayer1.actionCard = null;
                selectedCardElement.classList.remove("selected");
                updatePlayButton();
                return;
            }
            selectedCardPlayer1.actionCard = { card, index };
            moveCardToBattleZone(playerId, card, index);
        }
    }

    highlightSelectedCards(playerId);
    updatePlayButton();
}

// Ensure only valid selections are allowed
function isPlayer1SelectionValid() {
    if (selectedCardPlayer1.godCard && !selectedCardPlayer1.actionCard) return true;
    if (!selectedCardPlayer1.godCard && selectedCardPlayer1.actionCard) return true;

    if (selectedCardPlayer1.godCard && selectedCardPlayer1.actionCard) {
        return doClassesMatch(selectedCardPlayer1.godCard.card, selectedCardPlayer1.actionCard.card);
    }

    return false;
}

// Check if selected god and action card match in class
function doClassesMatch(godCard, actionCard) {
    if (!godCard || !actionCard) return false;
    return godCard.classes.some(cls => actionCard.classes.includes(cls));
}

// Enable or disable Play Turn button
function updatePlayButton() {
    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.disabled = !isPlayer1SelectionValid();
    }
}

// Highlight selected cards
function highlightSelectedCards(playerId) {
    const container = document.getElementById(`${playerId}-cards`);
    const cardElements = container.getElementsByClassName("card");

    Array.from(cardElements).forEach((cardElement, index) => {
        cardElement.classList.remove("selected");
        if (index === selectedCardPlayer1.godCard?.index || index === selectedCardPlayer1.actionCard?.index) {
            cardElement.classList.add("selected");
        }
    });
}
// Ensure battle system is loaded
if (!battleSystem) {
    console.error("Battle system not loaded. Cannot proceed.");
    return;
}

// AI selects a card for battle
function selectAICard(hand) {
    if (!hand || hand.length === 0) {
        console.warn("AI has no available cards to play.");
        return null;
    }

    const godCard = hand.find(card => card.type === "god");
    let actionCard = null;

    if (godCard) {
        actionCard = hand.find(card => card.type === "action" && doClassesMatch(godCard, card));
    }

    if (!godCard) {
        actionCard = hand.find(card => card.type === "action");
    }

    selectedCardPlayer2.godCard = godCard || null;
    selectedCardPlayer2.actionCard = actionCard || null;

    if (godCard) moveCardToBattleZone("player2", godCard, hand.indexOf(godCard));
    if (actionCard) moveCardToBattleZone("player2", actionCard, hand.indexOf(actionCard));

    return godCard;
}

// Play a turn
function playTurn() {
    if (!ensureBattleSystemLoaded()) {
        console.error("Battle system not loaded. Cannot proceed with turn.");
        return;
    }

    if (!selectedCardPlayer1.godCard && !selectedCardPlayer1.actionCard) {
        alert("Please select at least one card!");
        return;
    }

    const player1God = selectedCardPlayer1.godCard?.card || null;
    const player1Action = selectedCardPlayer1.actionCard?.card || null;
    const player2God = selectAICard(player2Hand) || null;
    const player2Action = selectedCardPlayer2.actionCard?.card || null;

    // Validate combos based on JSON rules
    if (player1God && player1Action && !doClassesMatch(player1God, player1Action)) {
        alert("Your selected god and action card classes do not match!");
        resetSelections();
        return;
    }

    if (player2God && player2Action && !doClassesMatch(player2God, player2Action)) {
        selectedCardPlayer2.actionCard = null;
    }

    // Apply action effects dynamically from JSON
    if (player1Action) applyActionEffect(player1Action, player2God);
    if (player2Action && player1God) applyActionEffect(player2Action, player1God);

    // Call JSON-based battle logic
    if (player1God && player2God) {
        resolveBattleUsingJSON(player1God, player2God);
    } else if (player1Action && !player1God) {
        resolveActionOnlyAttack(player1Action, player2God);
    } else if (player2Action && !player2God) {
        resolveActionOnlyAttack(player2Action, player1God);
    }

    resetSelections();
    checkGameOver();
}

// Resolve a battle using JSON logic
function resolveBattleUsingJSON(card1, card2) {
    if (!battleSystem || !battleSystem.battleRules) {
        console.error("Battle system JSON is missing battle rules.");
        return;
    }

    console.log(`Resolving battle: ${card1.name} vs ${card2.name}`);

    while (card1.health > 0 && card2.health > 0) {
        let firstAttacker = card1.speed >= card2.speed ? card1 : card2;
        let secondAttacker = firstAttacker === card1 ? card2 : card1;

        executeAttack(firstAttacker, secondAttacker);
        if (secondAttacker.health > 0) executeAttack(secondAttacker, firstAttacker);
    }

    if (card1.health <= 0) logResult(`${card1.name} has been defeated!`);
    if (card2.health <= 0) logResult(`${card2.name} has been defeated!`);

    manageDecks(card1, card2);
}

// Execute an attack using JSON multipliers
function executeAttack(attacker, defender) {
    let baseDamage = attacker.power;
    let damageMultiplier = 1;

    // Apply element strengths/weaknesses
    if (battleSystem.elementMultipliers[attacker.element] && battleSystem.elementMultipliers[attacker.element][defender.element]) {
        damageMultiplier *= battleSystem.elementMultipliers[attacker.element][defender.element];
    }

    // Apply class multipliers
    if (battleSystem.classMultipliers[attacker.classes] && battleSystem.classMultipliers[attacker.classes][defender.classes]) {
        damageMultiplier *= battleSystem.classMultipliers[attacker.classes][defender.classes];
    }

    let finalDamage = Math.round(baseDamage * damageMultiplier);
    defender.health = Math.max(0, defender.health - finalDamage);
    logResult(`${attacker.name} attacks ${defender.name} for ${finalDamage} damage.`);
}

// Manage decks after battle
function manageDecks(card1, card2) {
    if (card1.health > 0) {
        player1Deck.push(card1);
    } else {
        player1DiscardPile.push(card1);
    }

    if (card2.health > 0) {
        player2Deck.push(card2);
    } else {
        player2DiscardPile.push(card2);
    }

    if (player1Deck.length > 0) player1Hand.push(player1Deck.shift());
    if (player2Deck.length > 0) player2Hand.push(player2Deck.shift());
}

// Apply an action card effect using JSON logic
function applyActionEffect(actionCard, targetCard) {
    if (!battleSystem.actionEffects || !battleSystem.actionEffects[actionCard.name]) {
        console.warn(`No action effect found for ${actionCard.name}.`);
        return;
    }

    let effect = battleSystem.actionEffects[actionCard.name];

    if (effect.type === "damage") {
        targetCard.health = Math.max(0, targetCard.health - effect.value);
        logResult(`${actionCard.name} deals ${effect.value} damage to ${targetCard.name}.`);
    } else if (effect.type === "heal") {
        targetCard.health += effect.value;
        logResult(`${actionCard.name} heals ${targetCard.name} for ${effect.value}.`);
    } else if (effect.type === "status") {
        targetCard.statusEffect = effect.status;
        logResult(`${targetCard.name} is now affected by ${effect.status}.`);
    }
}

// Check if the battle system is loaded
function ensureBattleSystemLoaded() {
    if (!battleSystem) {
        console.error("Battle system JSON has not been loaded.");
        return false;
    }
    return true;
}
// Check for game over conditions
function checkGameOver() {
    if (player1Deck.length === 0 && player1Hand.length === 0) {
        announceWinner("Player 2");
    } else if (player2Deck.length === 0 && player2Hand.length === 0) {
        announceWinner("Player 1");
    }
}

// Announce the winner
function announceWinner(winningPlayer) {
    const winnerPopup = document.createElement("div");
    winnerPopup.className = "winner-popup";
    winnerPopup.innerHTML = `
        <h2>${winningPlayer} Wins!</h2>
        <button id="restart-game">Restart Game</button>
    `;
    document.body.appendChild(winnerPopup);

    document.getElementById("restart-game").addEventListener("click", resetGame);
}

// Reset the game
function resetGame() {
    player1Deck = [...originalDeck];
    player2Deck = [...originalDeck];
    player1Hand = [];
    player2Hand = [];
    player1DiscardPile = [];
    player2DiscardPile = [];
    document.getElementById("player1-cards").innerHTML = "";
    document.getElementById("player2-cards").innerHTML = "";
    document.getElementById("results-log").innerHTML = "";
    document.getElementById("battle-zone").innerHTML = "";
    document.querySelector(".winner-popup")?.remove();
    initializeGame();
}

// Move selected cards to the battle zone
function moveCardToBattleZone(playerId, card, index) {
    const container = document.getElementById(`${playerId}-cards`);
    const battleZone = document.getElementById("battle-zone");
    
    if (!container || !battleZone) {
        console.error(`Error: Card container or battle zone not found.`);
        return;
    }

    const cardElements = container.getElementsByClassName("card");
    const selectedCardElement = cardElements[index];

    if (!selectedCardElement) {
        console.error("Error: Selected card element not found in DOM.");
        return;
    }

    battleZone.appendChild(selectedCardElement.cloneNode(true));
    selectedCardElement.classList.add("selected");
}

// Reset selections and return cards to hand
function resetSelections() {
    selectedCardPlayer1 = { godCard: null, actionCard: null };
    selectedCardPlayer2 = { godCard: null, actionCard: null };

    const battleZone = document.getElementById("battle-zone");
    battleZone.innerHTML = ""; 

    highlightSelectedCards("player1");
    highlightSelectedCards("player2");
}

// Highlight selected cards
function highlightSelectedCards(playerId) {
    const container = document.getElementById(`${playerId}-cards`);
    const cardElements = container.getElementsByClassName("card");

    Array.from(cardElements).forEach((cardElement, index) => {
        cardElement.classList.remove("selected");
        if (
            index === selectedCardPlayer1.godCard?.index || 
            index === selectedCardPlayer1.actionCard?.index
        ) {
            cardElement.classList.add("selected");
        }
    });
}

// Log results to the game log
function logResult(message) {
    const resultsLog = document.getElementById("results-log");
    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    resultsLog.appendChild(logEntry);

    while (resultsLog.children.length > 10) {
        resultsLog.removeChild(resultsLog.firstChild);
    }

    resultsLog.scrollTop = resultsLog.scrollHeight;
}

// Handle special attack popup
function triggerSpecialAttackPopup(attackName, description, imageSrc) {
    const popup = document.createElement("div");
    popup.className = "special-attack-popup";
    popup.innerHTML = `
        <h2>${attackName} Activated!</h2>
        <img src="${imageSrc}" alt="${attackName}" class="attack-image">
        <p>${description}</p>
        <button id="continue-battle">Continue</button>
    `;
    document.body.appendChild(popup);

    document.getElementById("continue-battle").addEventListener("click", () => {
        popup.remove();
    });
}
// Function to apply status effects from elemental attacks
function applyStatusEffect(target, statusEffect) {
    if (!target || !statusEffect) return;

    target.status = statusEffect;
    logResult(`${target.name} is now affected by ${statusEffect}!`);
}

// Function to handle special attack execution
function executeSpecialAttack(player, godCard, actionCard) {
    if (!godCard || !actionCard) return;

    const specialAttack = battleSystem.specialAttacks[godCard.name]?.[actionCard.name];
    if (specialAttack) {
        triggerSpecialAttackPopup(specialAttack.name, specialAttack.description, specialAttack.image);
        return specialAttack.damage;
    }

    return 0; // No special attack found, return no additional damage
}

// Function to calculate battle damage
function calculateDamage(attacker, defender, attackType) {
    let baseDamage = attacker.power;
    let damageMultiplier = 1;

    // Check for class-based synergies
    if (battleSystem.classSynergies[attacker.class] && battleSystem.classSynergies[attacker.class].includes(attackType)) {
        damageMultiplier *= 1.5; // Increase damage for synergy
        logResult(`${attacker.name} gains a synergy bonus!`);
    }

    // Apply elemental weaknesses & strengths
    if (attacker.element && defender.element) {
        if (battleSystem.elementMultipliers[attacker.element]?.strongAgainst.includes(defender.element)) {
            damageMultiplier *= 1.25; // Bonus damage if strong against opponent
            logResult(`${attacker.name}'s ${attacker.element} attack is strong against ${defender.name}!`);
        } else if (battleSystem.elementMultipliers[attacker.element]?.weakAgainst.includes(defender.element)) {
            damageMultiplier *= 0.75; // Reduced damage if weak
            logResult(`${attacker.name}'s ${attacker.element} attack is weak against ${defender.name}.`);
        }
    }

    return Math.round(baseDamage * damageMultiplier);
}

// Function to handle combat between two cards
function resolveBattle(player1Card, player2Card) {
    if (!player1Card || !player2Card) return;

    logResult(`Battle begins: ${player1Card.name} vs ${player2Card.name}!`);

    while (player1Card.health > 0 && player2Card.health > 0) {
        if (player1Card.speed >= player2Card.speed) {
            attack(player1Card, player2Card);
            if (player2Card.health > 0) attack(player2Card, player1Card);
        } else {
            attack(player2Card, player1Card);
            if (player1Card.health > 0) attack(player1Card, player2Card);
        }
    }

    if (player1Card.health <= 0) {
        logResult(`${player1Card.name} has been defeated!`);
        discardCard("player1", player1Card);
    }
    if (player2Card.health <= 0) {
        logResult(`${player2Card.name} has been defeated!`);
        discardCard("player2", player2Card);
    }
}

// Function to handle attacks
function attack(attacker, defender) {
    if (!attacker || !defender) return;

    const damage = calculateDamage(attacker, defender, attacker.attackType);
    defender.health = Math.max(0, defender.health - damage);

    logResult(`${attacker.name} attacks ${defender.name} for ${damage} damage!`);

    if (attacker.attackType === "elemental" && battleSystem.elementStatusEffects[attacker.element]) {
        applyStatusEffect(defender, battleSystem.elementStatusEffects[attacker.element]);
    }
}

// Function to discard a defeated or used card
function discardCard(playerId, card) {
    if (playerId === "player1") {
        player1DiscardPile.push(card);
    } else if (playerId === "player2") {
        player2DiscardPile.push(card);
    }
}

// Function to check and draw new cards at the start of a round
function startNextRound() {
    document.getElementById("battle-zone").innerHTML = "";

    while (player1Hand.length < 5 && player1Deck.length > 0) {
        player1Hand.push(player1Deck.shift());
    }
    while (player2Hand.length < 5 && player2Deck.length > 0) {
        player2Hand.push(player2Deck.shift());
    }

    if (player1Hand.length === 0 && player1Deck.length === 0) {
        checkGameOver();
        return;
    }
    if (player2Hand.length === 0 && player2Deck.length === 0) {
        checkGameOver();
        return;
    }

    updateUI();
}

// Function to update the game UI
function updateUI() {
    displayCards("player1", player1Hand);
    displayCards("player2", player2Hand);
    document.getElementById("results-log").innerHTML = "";
}

// Function to manage deck representation
function updateDeckDisplay() {
    document.getElementById("player1-deck").textContent = player1Deck.length;
    document.getElementById("player2-deck").textContent = player2Deck.length;
}
// Function to check if the game is over
function checkGameOver() {
    if (player1Deck.length === 0 && player1Hand.length === 0) {
        displayGameOver("Player 2 wins! Player 1 has no more cards.");
        return;
    }
    if (player2Deck.length === 0 && player2Hand.length === 0) {
        displayGameOver("Player 1 wins! Player 2 has no more cards.");
        return;
    }
}

// Function to display game over popup
function displayGameOver(message) {
    const gameOverPopup = document.createElement("div");
    gameOverPopup.id = "game-over-popup";
    gameOverPopup.className = "popup";
    gameOverPopup.innerHTML = `
        <h2>Game Over</h2>
        <p>${message}</p>
        <button onclick="restartGame()">Play Again</button>
    `;

    document.body.appendChild(gameOverPopup);
}

// Function to restart the game
function restartGame() {
    player1Deck = structuredClone(fullDeck);
    player2Deck = structuredClone(fullDeck);
    player1Hand = [];
    player2Hand = [];
    player1DiscardPile = [];
    player2DiscardPile = [];

    document.getElementById("game-over-popup").remove();
    initializeGame();
}

// Function to handle special attack popups
function triggerSpecialAttackPopup(attackName, attackDescription, attackImage) {
    const specialPopup = document.createElement("div");
    specialPopup.id = "special-attack-popup";
    specialPopup.className = "popup";
    specialPopup.innerHTML = `
        <h2>Special Attack!</h2>
        <img src="${attackImage}" alt="${attackName}" class="special-attack-image">
        <p><strong>${attackName}</strong></p>
        <p>${attackDescription}</p>
        <button onclick="closeSpecialPopup()">Continue</button>
    `;

    document.body.appendChild(specialPopup);
}

// Function to close the special attack popup
function closeSpecialPopup() {
    const popup = document.getElementById("special-attack-popup");
    if (popup) popup.remove();
}

// Function to move a selected card to the battle zone
function moveCardToBattleZone(playerId, card, index) {
    const battleZone = document.getElementById("battle-zone");
    if (!battleZone) return console.error("Battle zone not found");

    const cardElement = document.createElement("div");
    cardElement.className = "battle-card";
    cardElement.innerHTML = `
        <img src="${card.image}" alt="${card.name}" class="card-image">
        <h3>${card.name}</h3>
        <p>Type: ${card.type}</p>
        ${card.classes ? `<p>Class: ${card.classes.join(", ")}</p>` : ""}
        ${card.element ? `<p>Element: ${card.element}</p>` : ""}
        ${card.health ? `<p>HP: ${card.health}</p>` : ""}
        ${card.power ? `<p>Power: ${card.power}</p>` : ""}
        ${card.speed ? `<p>Speed: ${card.speed}</p>` : ""}
        ${card.defense ? `<p>Defense: ${card.defense}</p>` : ""}
        ${card.effect ? `<p>Effect: ${card.effect}</p>` : ""}
    `;

    battleZone.appendChild(cardElement);

    if (playerId === "player1") {
        selectedCardPlayer1 = { ...selectedCardPlayer1, [card.type]: { card, index } };
    } else {
        selectedCardPlayer2 = { ...selectedCardPlayer2, [card.type]: { card, index } };
    }

    updatePlayButton();
}

// Function to reset the battle zone
function resetBattleZone() {
    document.getElementById("battle-zone").innerHTML = "";
}

// Function to check if player selection is valid
function isPlayerSelectionValid(playerId) {
    const selected = playerId === "player1" ? selectedCardPlayer1 : selectedCardPlayer2;

    if (selected.godCard || selected.classAction || selected.elementAction) {
        if (selected.godCard && selected.classAction) {
            return battleSystem.classSynergies[selected.godCard.card.class]?.includes(selected.classAction.card.name);
        }
        if (selected.godCard && selected.elementAction) {
            return battleSystem.elementMultipliers[selected.godCard.card.element]?.includes(selected.elementAction.card.name);
        }
        return true;
    }
    return false;
}

// Function to update play button state
function updatePlayButton() {
    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.disabled = !(isPlayerSelectionValid("player1") && isPlayerSelectionValid("player2"));
    }
}

// Function to log results
function logResult(message) {
    const resultsLog = document.getElementById("results-log");
    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    resultsLog.appendChild(logEntry);

    // Keep log to last 10 entries
    while (resultsLog.children.length > 10) {
        resultsLog.removeChild(resultsLog.firstChild);
    }

    resultsLog.scrollTop = resultsLog.scrollHeight;
}
// Function to resolve battle
function resolveBattle() {
    const player1Card = selectedCardPlayer1.godCard?.card || selectedCardPlayer1.classAction?.card || selectedCardPlayer1.elementAction?.card;
    const player2Card = selectedCardPlayer2.godCard?.card || selectedCardPlayer2.classAction?.card || selectedCardPlayer2.elementAction?.card;

    if (!player1Card || !player2Card) {
        console.error("Battle cannot proceed, missing cards.");
        return;
    }

    // Log initial battle state
    logResult(`${player1Card.name} VS ${player2Card.name}`);

    // Determine if there are synergies
    let specialAttackTriggered = false;
    let player1Bonus = 1;
    let player2Bonus = 1;

    if (selectedCardPlayer1.godCard && selectedCardPlayer1.classAction) {
        const synergy = battleSystem.classSynergies[selectedCardPlayer1.godCard.card.class]?.includes(selectedCardPlayer1.classAction.card.name);
        if (synergy) {
            player1Bonus = 1.5;
            specialAttackTriggered = true;
            triggerSpecialAttackPopup(
                selectedCardPlayer1.godCard.card.name,
                `A powerful synergy attack!`,
                selectedCardPlayer1.godCard.card.image
            );
        }
    }

    if (selectedCardPlayer2.godCard && selectedCardPlayer2.classAction) {
        const synergy = battleSystem.classSynergies[selectedCardPlayer2.godCard.card.class]?.includes(selectedCardPlayer2.classAction.card.name);
        if (synergy) {
            player2Bonus = 1.5;
            specialAttackTriggered = true;
            triggerSpecialAttackPopup(
                selectedCardPlayer2.godCard.card.name,
                `A powerful synergy attack!`,
                selectedCardPlayer2.godCard.card.image
            );
        }
    }

    // Elemental multiplier logic
    const elementMultiplier1 = battleSystem.elementMultipliers[player1Card.element]?.[player2Card.element] || 1;
    const elementMultiplier2 = battleSystem.elementMultipliers[player2Card.element]?.[player1Card.element] || 1;

    let player1Damage = Math.round(player1Card.power * player1Bonus * elementMultiplier1);
    let player2Damage = Math.round(player2Card.power * player2Bonus * elementMultiplier2);

    logResult(`${player1Card.name} attacks for ${player1Damage} damage!`);
    logResult(`${player2Card.name} attacks for ${player2Damage} damage!`);

    // Apply damage
    player1Card.health -= player2Damage - (player1Card.defense || 0);
    player2Card.health -= player1Damage - (player2Card.defense || 0);

    // Check for status effects if an element action was played
    if (selectedCardPlayer1.elementAction) {
        applyStatusEffect(player2Card, selectedCardPlayer1.elementAction.card.element);
    }
    if (selectedCardPlayer2.elementAction) {
        applyStatusEffect(player1Card, selectedCardPlayer2.elementAction.card.element);
    }

    // Determine winner of battle
    if (player1Card.health <= 0 && player2Card.health <= 0) {
        logResult("Both cards are defeated! No winner this round.");
        discardCard(player1Card, "player1");
        discardCard(player2Card, "player2");
    } else if (player1Card.health <= 0) {
        logResult(`${player1Card.name} is defeated!`);
        discardCard(player1Card, "player1");
        sendWinningCardToDeck(player2Card, "player2");
    } else if (player2Card.health <= 0) {
        logResult(`${player2Card.name} is defeated!`);
        discardCard(player2Card, "player2");
        sendWinningCardToDeck(player1Card, "player1");
    } else {
        logResult("The battle continues...");
    }

    resetSelections();
    checkGameOver();
}

// Function to apply status effects
function applyStatusEffect(targetCard, element) {
    if (!targetCard || !element) return;

    const statusEffect = battleSystem.elementStatusEffects[element];
    if (statusEffect && statusEffect !== "None") {
        logResult(`${targetCard.name} is now affected by ${statusEffect}!`);
        targetCard.status = statusEffect;
    }
}

// Function to discard a card
function discardCard(card, playerId) {
    if (playerId === "player1") {
        player1DiscardPile.push(card);
    } else {
        player2DiscardPile.push(card);
    }
}

// Function to return winning card to deck
function sendWinningCardToDeck(card, playerId) {
    if (playerId === "player1") {
        player1Deck.push(card);
    } else {
        player2Deck.push(card);
    }
}

// Function to reset selections after a battle round
function resetSelections() {
    selectedCardPlayer1 = { godCard: null, classAction: null, elementAction: null };
    selectedCardPlayer2 = { godCard: null, classAction: null, elementAction: null };
    resetBattleZone();
    updatePlayButton();
}

// Function to start the next round
function startNextRound() {
    if (document.getElementById("battle-result-popup")) {
        document.getElementById("battle-result-popup").remove();
    }
    drawNewCards();
}

// Function to draw new cards
function drawNewCards() {
    while (player1Hand.length < 5 && player1Deck.length > 0) {
        player1Hand.push(player1Deck.shift());
    }
    while (player2Hand.length < 5 && player2Deck.length > 0) {
        player2Hand.push(player2Deck.shift());
    }
    updateCardDisplay();
}

// Function to update the display of player hands
function updateCardDisplay() {
    document.getElementById("player1-cards").innerHTML = "";
    document.getElementById("player2-cards").innerHTML = "";

    player1Hand.forEach((card, index) => {
        createCardElement(card, "player1", index);
    });

    player2Hand.forEach((card, index) => {
        createCardElement(card, "player2", index);
    });
}
