document.addEventListener("DOMContentLoaded", () => {
    console.log("Page Loaded");

   function generateCards(data) {
    const player1Container = document.getElementById("player1-cards");
    const player2Container = document.getElementById("player2-cards");

    if (!player1Container || !player2Container) {
        console.error("Error: Card containers not found in the DOM.");
        return;
    }

    // Clear previous cards
    player1Container.innerHTML = "";
    player2Container.innerHTML = "";

    // Function to create a card element
    function createCardElement(card) {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");

        if (card.type === "god") {
            cardElement.innerHTML = `
                <strong>${card.name}</strong> <br>
                Type: God <br>
                HP: ${card.health} | Pow: ${card.power} | Spd: ${card.speed}
            `;
        } else if (card.type === "action") {
            cardElement.innerHTML = `
                <strong>${card.name}</strong> <br>
                Type: Action <br>
                Effect: ${card.effect}
            `;
        } else {
            console.warn("Unknown card type:", card);
        }

        return cardElement;
    }

    // Generate Player 1 Cards
    data.godCards.forEach(card => player1Container.appendChild(createCardElement(card)));
    data.actionCards.forEach(card => player1Container.appendChild(createCardElement(card)));

    // Generate Player 2 Cards
    data.godCards.forEach(card => player2Container.appendChild(createCardElement(card)));
    data.actionCards.forEach(card => player2Container.appendChild(createCardElement(card)));

    console.log("Cards generated successfully:", document.querySelectorAll(".card"));
}

    // Load data and start the game
    async function loadData() {
        try {
            const response = await fetch("https://carlygaejepsen.github.io/strategic-mythology/static/data.json"); // Path to your JSON file
            if (!response.ok) throw new Error("Failed to fetch JSON data.");
            
            const data = await response.json();
            console.log("JSON data loaded:", data);

            generateCards(data);
        } catch (error) {
            console.error("Error loading JSON:", error);
        }
    }

    // New Game Button Click - Load Cards
    document.getElementById("start-game").addEventListener("click", () => {
        console.log("Starting new game...");
        loadData(); // ✅ This loads JSON and creates cards
    });

    // Set up MutationObserver to watch for cards being added
    const observer = new MutationObserver(() => {
        const cardElement = document.querySelector(".card");
        if (cardElement) {
            console.log("Card element found!", cardElement.getBoundingClientRect());
            observer.disconnect(); // Stop observing once found
        } else {
            console.warn("Waiting for cards to be added...");
        }
    });

    // Observe the player card areas
    const player1CardsContainer = document.getElementById("player1-cards");
    const player2CardsContainer = document.getElementById("player2-cards");

    if (player1CardsContainer && player2CardsContainer) {
        observer.observe(player1CardsContainer, { childList: true, subtree: true });
        observer.observe(player2CardsContainer, { childList: true, subtree: true });
    } else {
        console.error("Error: Card containers not found for MutationObserver.");
    }

    console.log("Waiting for cards to be added...");
});


    document.getElementById("start-game").addEventListener("click", initializeGame);
    document.getElementById("play-turn").addEventListener("click", playTurn);


// Global variables
let player1Deck = [];
let player2Deck = [];
let player1Hand = [];
let player2Hand = [];
let player1DiscardPile = [];
let player2DiscardPile = [];

let selectedCardPlayer1 = { godCard: null, actionCard: null };
let selectedCardPlayer2 = { godCard: null, actionCard: null };
let godCards = [];
let actionCards = [];
const HAND_SIZE = 5; // Define this constant at the top of your script

async function loadData() {
    try {
        const response = await fetch("https://carlygaejepsen.github.io/strategic-mythology/static/data.json"); // Path to your JSON file
        if (!response.ok) throw new Error("Failed to fetch JSON data.");
        
        const data = await response.json();
        console.log("JSON data loaded:", data);

        generateCards(data); // Generate cards first
        initializeGame(); // Then initialize the game
    } catch (error) {
        console.error("Error loading JSON:", error);
    }
}

// Fetch card data when "New Game" button is clicked
document.getElementById("start-game").addEventListener("click", () => {
    fetch("https://carlygaejepsen.github.io/strategic-mythology/static/data.json") // Update this path if needed
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load card data");
            }
            return response.json();
        })
        .then(data => {
            console.log("Card data loaded:", data); // Debugging
            generateCards(data); // Call function to generate cards
        })
        .catch(error => {
            console.error("Error loading JSON:", error);
        });
});

// Debugging: Run this on page load to check if JSON is accessible
fetch("https://carlygaejepsen.github.io/strategic-mythology/static/data.json")
    .then(response => response.json())
    .then(data => console.log("JSON data available:", data))
    .catch(error => console.error("JSON fetch error:", error));

function drawInitialHand(deck) {
    if (!Array.isArray(deck) || deck.length === 0) {
        console.error("Error: Deck is empty or not initialized.");
        return [];
    }

    return deck.splice(0, HAND_SIZE); // Use the global HAND_SIZE constant
}

function initializeGame() {
    console.log("Game initialized!");

    // Shuffle and deal decks for both players
    player1Deck = shuffleDeck([...godCards, ...actionCards]);
    player2Deck = shuffleDeck([...godCards, ...actionCards]);

  
	player1Hand = drawInitialHand(player1Deck, HAND_SIZE);
	player2Hand = drawInitialHand(player2Deck, HAND_SIZE);


    displayCards("player1", player1Hand);
    displayCards("player2", player2Hand);

    // Reset selections and results log
    selectedCardPlayer1 = { godCard: null, actionCard: null };
    selectedCardPlayer2 = { godCard: null, actionCard: null };
	document.getElementById("results-log").innerHTML = "";
   
   if (document.getElementById("play-turn")) {
		document.getElementById("play-turn").disabled = true;
	}
}

// Shuffle deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function displayCards(playerId, hand) {
    const container = document.getElementById(`${playerId}-cards`);
    
    if (!container) {
        console.error(`Error: Element with id "${playerId}-cards" not found.`);
        return;
    }

    container.innerHTML = ""; // Clear previous cards

    hand.forEach((card, index) => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
		cardElement.style.width = "140px";
        cardElement.style.maxWidth = "160px";
        cardElement.style.aspectRatio = "3 / 4";

        // Add the card's image and name
        cardElement.innerHTML = `
            <img src="${card.image}" alt="${card.name}" style="width: 100%; max-width: 120px; max-height: 140px; object-fit: contain; border-radius: 6px;" class="card-image">
            <h3 style="font-size: 14px; margin: 4px 0;">${card.name}</h3>
            <p style="font-size: 12px; line-height: 1.2; margin: 2px 0;">Type: ${card.type}</p>
            ${card.type === "god" ? `<p style="font-size: 12px; line-height: 1.2; margin: 2px 0;">HP: ${card.health}, Pow: ${card.power}, Spd: ${card.speed}</p>` : `<p style="font-size: 12px; line-height: 1.2; margin: 2px 0;">${card.effect}</p>`}
        `;

        // Add click listener for Player 1
        if (playerId === "player1") {
            cardElement.addEventListener("click", () => selectCard(playerId, card, index));
        }

        container.appendChild(cardElement);
    });
	makeCardsClickable();
}


function makeCardsClickable() {
    console.log("Making cards clickable...");

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", function () {
            const playerId = this.closest(".card-container").id.includes("player1") ? "player1" : "player2";
            const index = Array.from(this.parentElement.children).indexOf(this);
            console.log(`Card clicked: ${this.innerText}`);
            
            selectCard(playerId, index);
        });
    });
}

// Select a card
function selectCard(playerId, card, index) {
    const container = document.getElementById(`${playerId}-cards`);
    const cardElements = container.getElementsByClassName("card");
    const selectedCardElement = cardElements[index];

    if (!selectedCardElement) {
        console.error("Error: Selected card element not found in DOM.");
        return;
    }

    if (playerId === "player1") {
        // Selecting a God Card
        if (card.type === "god") {
            if (selectedCardPlayer1.godCard?.index === index) {
                // Deselect if already selected
                selectedCardPlayer1.godCard = null;
                selectedCardElement.classList.remove("selected");
                updatePlayButton();
                return;
            }
            // Assign the new selection
            selectedCardPlayer1.godCard = { card, index };
            moveCardToCenter(selectedCardElement, "battle-zone"); // Move to battle zone
        } 

        // Selecting an Action Card
        else if (card.type === "action") {
            if (selectedCardPlayer1.actionCard?.index === index) {
                // Deselect if already selected
                selectedCardPlayer1.actionCard = null;
                selectedCardElement.classList.remove("selected");
                updatePlayButton();
                return;
            }
            // Assign the new selection
            selectedCardPlayer1.actionCard = { card, index };
            moveCardToCenter(selectedCardElement, "battle-zone"); // Move to battle zone
        }

        // Ensure Class Match if Both Are Selected
        if (selectedCardPlayer1.godCard && selectedCardPlayer1.actionCard) {
            if (!doClassesMatch(selectedCardPlayer1.godCard.card, selectedCardPlayer1.actionCard.card)) {
                alert("You can only combine god and action cards of the same class!");
                selectedCardPlayer1.actionCard = null; // Remove invalid selection
                updatePlayButton();
                return;
            }
        }

        // Highlight the selected card
        highlightSelectedCards("player1");
        updatePlayButton();
    }
}

// Function for Valid Player 1 Selection
function isPlayer1SelectionValid() {
    // Allow playing a single god OR action card
    if (selectedCardPlayer1.godCard && !selectedCardPlayer1.actionCard) {
        return true;
    }
    if (!selectedCardPlayer1.godCard && selectedCardPlayer1.actionCard) {
        return true;
    }

    // If both a god and an action card are selected, they must have the same class
    if (selectedCardPlayer1.godCard && selectedCardPlayer1.actionCard) {
        return doClassesMatch(selectedCardPlayer1.godCard.card, selectedCardPlayer1.actionCard.card);
    }

    return false;
}

function doClassesMatch(godCard, actionCard) {
    if (!godCard || !actionCard) return false; // Prevents undefined errors

    // Check if any class in the god card matches any class in the action card
    return godCard.classes.some(cls => actionCard.classes.includes(cls));
}

// Function to Enable/Disable the Play Turn Button
function updatePlayButton() {
    const playTurnButton = document.getElementById("play-turn");
    if (playTurnButton) {
        playTurnButton.disabled = !isPlayer1SelectionValid();
    }
}

// Highlight Selected Cards

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

// AI selects a card and moves it to the battle center
function selectAICard(hand) {
    // Find a god card and an action card that matches its class
    const godCard = hand.find(card => card.type === "god");
    let actionCard = godCard 
        ? hand.find(card => card.type === "action" && card.classes.some(cls => godCard.classes.includes(cls)))
        : null;

    // Fallback: If no matching action card, select any action card
    if (godCard && !actionCard) {
        actionCard = hand.find(card => card.type === "action");
    }

    // Update the selected cards for Player 2
    selectedCardPlayer2.godCard = godCard || null;
    selectedCardPlayer2.actionCard = actionCard || null;

    // Move cards to the battle center visually
    if (godCard) {
        const godCardElement = createCardElement(godCard);
        moveCardToCenter(godCardElement, "battle-zone");
    }
    if (actionCard) {
        const actionCardElement = createCardElement(actionCard);
        moveCardToCenter(actionCardElement, "battle-zone");
    }

    return godCard; // Return the selected god card for further use
}

// Move card to the battle center with animation
function moveCardToCenter(cardElement, containerId) {
    const centerContainer = document.getElementById(containerId);

    if (!centerContainer) {
        console.error("Error: Center container not found.");
        return;
    }

    // Create a clone of the card
    const clone = cardElement.cloneNode(true);

    // Style the clone for animation
    clone.style.position = "absolute"; // Use absolute positioning for smooth animation
    clone.style.zIndex = "1000";
    clone.style.width = "100px"; // Ensures correct scaling
    clone.style.maxWidth = "120px"; // Prevents oversized images
    clone.style.height = "auto";

    // Get the initial position of the card
    const rect = cardElement.getBoundingClientRect();
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;

    // Append the clone to the body temporarily for animation
    document.body.appendChild(clone);

    // Animate the card to the center
    requestAnimationFrame(() => {
        clone.style.transition = "all 0.5s ease";

        // Calculate the center position
        const centerRect = centerContainer.getBoundingClientRect();
        const centerX = centerRect.left + centerRect.width / 2 - clone.offsetWidth / 2;
        const centerY = centerRect.top + centerRect.height / 2 - clone.offsetHeight / 2;

        clone.style.left = `${centerX}px`;
        clone.style.top = `${centerY}px`;
    });

    // After animation, move the clone to the center container
    setTimeout(() => {
        clone.style.position = "relative";
        clone.style.transition = "";
        clone.style.left = "";
        clone.style.top = "";
        clone.style.width = "100%"; // Ensure card scales properly
        clone.style.maxWidth = "120px"; // Prevent it from getting too large

        // Remove the clone from the body and append it to the center container
        document.body.removeChild(clone);
        centerContainer.appendChild(clone);
    }, 500); // Match the animation duration
}


// Play a single turn

   function playTurn() {
  function playTurn() {
    if (!selectedCardPlayer1.godCard && !selectedCardPlayer1.actionCard) {
        alert("Please select at least one card!");
        return;
    }

    const player1GodCard = selectedCardPlayer1?.godCard?.card;
    const player1ActionCard = selectedCardPlayer1?.actionCard?.card;
    const player2GodCard = selectAICard(player2Hand) || null;
    const player2ActionCard = selectedCardPlayer2?.actionCard?.card || null;

	
	// Validate combinations for Player 1
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
        selectedCardPlayer2.actionCard = null; // Discard invalid action card
		}
	}

    // Apply action card effects
    if (player1ActionCard) applyActionEffect(player1ActionCard, player2GodCard);
    if (player2ActionCard && player1GodCard) applyActionEffect(player2ActionCard, player1GodCard);


    // Resolve the battle if both god cards are present
    if (player1GodCard && player2GodCard) {
        resolveBattle(player1GodCard, player2GodCard);
    }

    // Reset selections and check if the game is over
    resetSelections();
	 checkGameOver();
   
}
 

 
// Manage decks and discards after battle
function manageDecks(card1, action1, card2, action2) {
    // Player 1
    if (card1 && card1.health > 0) {
        player1Deck.push(card1);
        if (action1) player1Deck.push(action1);
    } else {
        if (card1) player1DiscardPile.push(card1);
        if (action1) player1DiscardPile.push(action1);
    }

    // Player 2
    if (card2 && card2.health > 0) {
        player2Deck.push(card2);
        if (action2) player2Deck.push(action2);
    } else {
        if (card2) player2DiscardPile.push(card2);
        if (action2) player2DiscardPile.push(action2);
    }

    // Discard action cards played alone
    if (!card1 && action1) player1DiscardPile.push(action1);
    if (!card2 && action2) player2DiscardPile.push(action2);

    // Each player draws a new card
    if (player1Deck.length > 0) {
        player1Hand.push(player1Deck.shift());
    }
    if (player2Deck.length > 0) {
        player2Hand.push(player2Deck.shift());
    }
}

// Attack logic
function attack(attacker, defender) {
    let damage = attacker.power;

    // Class effectiveness logic
    if (attacker.classes.includes("Authorities") && defender.classes.includes("Malevolents")) {
        damage *= 1.25; // 25% bonus damage
    } else if (attacker.classes.includes("Malevolents") && defender.classes.includes("Authorities")) {
        damage *= 0.75; // 25% reduced damage
    }

    defender.health = Math.max(0, defender.health - Math.round(damage));
    logResult(`${attacker.name} attacks ${defender.name} for ${Math.round(damage)} damage.`);
}

// Apply action card effects
function applyActionEffect(actionCard, targetCard) {
    if (!actionCard) return;

    switch (actionCard.name) {
        case "Wave":
            logResult(`${actionCard.name} deals 6 damage to all enemy cards.`);
            if (targetCard) targetCard.health = Math.max(0, targetCard.health - 6);
            break;
        case "Lightning":
            logResult(`${actionCard.name} deals 10 damage to ${targetCard?.name || "no target"}.`);
            if (targetCard) targetCard.health = Math.max(0, targetCard.health - 10);
            break;
        case "Growth":
            logResult(`${actionCard.name} restores 5 health to ${targetCard?.name || "no target"}.`);
            if (targetCard) targetCard.health += 5;
            break;
        default:
            console.warn(`Action card ${actionCard.name} has no defined effect.`);
    }
}

// Resolve Battle
function resolveBattle(card1, card2) {
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

    if (card1.health <= 0) logResult(`${card1.name} has been defeated!`);
    if (card2.health <= 0) logResult(`${card2.name} has been defeated!`);
}


// Draw a card
function drawCard(playerId) {
    if (playerId === "player1" && player1Deck.length > 0) {
        player1Hand.push(player1Deck.shift());
    } else if (playerId === "player2" && player2Deck.length > 0) {
        player2Hand.push(player2Deck.shift());
    } else {
        logResult(`${playerId} cannot draw any more cards.`);
    }
}



// Reset selections
function resetSelections() {
    selectedCardPlayer1 = { godCard: null, actionCard: null };
    selectedCardPlayer2 = { godCard: null, actionCard: null };

    const battleCenter = document.getElementById("battle-zone");
    battleCenter.innerHTML = ""; // Clear the battle center visually

    highlightSelectedCards("player1");
highlightSelectedCards("player2");
}


// Log results
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
        alert("Player 2 wins! Player 1 has no more cards left.");
       
    } else if (player2Deck.length === 0 && player2Hand.length === 0) {
        alert("Player 1 wins! Player 2 has no more cards left.");
    
    }
}

// Reset the game
function resetGame() {
    player1Deck = [];
    player2Deck = [];
    player1Hand = [];
    player2Hand = [];
    document.getElementById("player1-cards").innerHTML = "";
    document.getElementById("player2-cards").innerHTML = "";
    document.getElementById("results-log").innerHTML = "";
    document.getElementById("play-turn").disabled = true;
}
   }
