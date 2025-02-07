// Variables
let p1Deck = [];
let p2Deck = [];
let p1BZ = [];
let p2BZ = [];
let currentPlayer = "p1";
let currentPhase = "deploy";
let turnStep = 0;
let selectedAttacker = null;

let elementEmojis = {};
let batSys = {};

//GAME LOADING AND INITIALIZATION
//
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}//2
//
function getElementSafe(id) {
    return document.getElementById(id) || null;
}
//
function getCardFromElement(cardElement) {
    if (!cardElement) {
        console.error("Null cardElement passed.");
        return null;
    }

    const nameElement = cardElement.querySelector(".mini-card-name") || cardElement.querySelector(".card-name-text");
    if (!nameElement) {
        console.error("Name element not found in card:", cardElement);
        return null;
    }

    const cardName = nameElement.textContent.trim();
    return (
        p1Hand.find(card => card.name === cardName) ||
        p2Hand.find(card => card.name === cardName) ||
        p1BZ.find(card => card.name === cardName) ||
        p2BZ.find(card => card.name === cardName) ||
        null
    );
}
//
function createCardElement(card) {
    if (!card || !card.name) {
        console.error("Invalid card object passed to createCardElement:", card);
        return null;
    }

    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    const nameElement = document.createElement("div");
    nameElement.classList.add("card-name");

    const nameText = document.createElement("span");
    nameText.textContent = card.name;
    nameText.classList.add("card-name-text");

    const elementEmojiSpan = document.createElement("span");
    elementEmojiSpan.classList.add("card-elements");
    if (card.element) {
        elementEmojiSpan.innerHTML = Array.isArray(card.element)
            ? card.element.map(el => elementEmojis[el] || "").filter(Boolean).join(" ")
            : elementEmojis[card.element] || "";
    }
    nameElement.appendChild(nameText);
    nameElement.appendChild(elementEmojiSpan);
    cardDiv.appendChild(nameElement);

    if (card.img) {
        const imgElement = document.createElement("img");
        imgElement.src = card.img;
        imgElement.alt = card.name;
        imgElement.classList.add("card-img");
        cardDiv.appendChild(imgElement);
    }

    if (card.classes?.length > 0) {
        const attributesElement = document.createElement("div");
        attributesElement.classList.add("card-attributes");
        attributesElement.textContent = card.classes.join(", ");
        cardDiv.appendChild(attributesElement);
    }

    if (card.hp || card.atk || card.def) {
        const statsElement = document.createElement("div");
        statsElement.classList.add("card-stats");
        statsElement.innerHTML = `❤️: ${card.hp || 0} ⚔️: ${card.atk || 0} 🛡️: ${card.def || 0}`;
        cardDiv.appendChild(statsElement);
    }


    return cardDiv;
}
//5
async function loadGameData() {
    const jsonFiles = [
        "water-chars.json", "elem-cards.json", "bat-sys.json", "beast-chars.json",
        "bully-chars.json", "celestial-chars.json", "char-desc-a.json", "class-cards.json",
        "game-config.json", "hero-chars.json", "life-chars.json", "mystical-chars.json",
        "olympian-chars.json", "plant-chars.json", "underworld-chars.json"
    ];
    const basePath = "https://carlygaejepsen.github.io/strategic-mythology/data/";
    try {
        const responses = await Promise.all(jsonFiles.map(file => fetch(basePath + file)));
        const data = await Promise.all(responses.map(async (res, index) => {
            if (!res.ok) throw new Error(`Failed to load ${jsonFiles[index]}`);
            return res.json();
        }));
        window.gameData = Object.fromEntries(jsonFiles.map((file, index) => [
            file.replace(".json", "").replace(/-/g, ""), data[index]
        ]));
        window.allCards = [
            ...(window.gameData.elemcards || []),
            ...(window.gameData.classcards || []),
            ...Object.values(window.gameData).flat().filter(item => item.type === "char")
        ];
    } catch (error) {
        console.error("Error loading game data:", error);
    }
}
//
async function loadGameConfig() {
    try {
        const response = await fetch("./data/game-config.json");
        if (!response.ok) throw new Error("Failed to load game-config.json");
        window.gameConfig = await response.json();
        elementEmojis = window.gameConfig.elementEmojis || {};
    } catch (error) {
        console.error("Error loading game config:", error);
    }
}
// 
async function loadBatSys() {
    try {
        const response = await fetch("./data/bat-sys.json");
        if (!response.ok) throw new Error("Failed to load bat-sys.json");
        batSys = await response.json();
    } catch (error) {
        console.error("Error loading battle system:", error);
    }
}
//
function buildDeck() {
    if (!window.allCards) return [];
    return shuffleDeck(window.allCards.filter(
        card => card.type === "char" || card.sub === "element" || card.sub === "class"
    ));
}
//
function renderBZ(playerBZ, battleZoneId) {
    const container = document.querySelector(`.${battleZoneId}`); // Match CSS class
    if (!container) return;
    container.innerHTML = "";

    playerBZ.forEach(card => {
        const cardElement = createCardElement(card);
        container.appendChild(cardElement);
    });
}

//10
function renderHand(hand, container, whichPlayer) {
    if (!container) return;
    container.innerHTML = "";

    hand.forEach(card => {
        const cardElement = createCardElement(card);
        if (whichPlayer === "p1") {
            cardElement.addEventListener("click", () => {
                playCard(card, p1Hand, p1BZ, "p1BZ");
                renderHand(p1Hand, container, whichPlayer);
            });
        }
        container.appendChild(cardElement);
    });
}

//
async function initGame() {
    try {
        console.log("Initializing game...");

        // Load all game data asynchronously
        await Promise.all([loadGameConfig(), loadGameData(), loadBatSys()]);

        // Validate that required game data is loaded
        if (!batSys?.turnStructure) throw new Error("Battle system data is missing or failed to load.");
        if (!window.gameConfig?.gameSettings?.maxHandSize) throw new Error("Game configuration is missing hand size settings.");

        // Assign DOM containers (DO NOT overwrite p1Hand and p2Hand)
        const p1HandContainer = document.querySelector(".player-hand");
        const p2HandContainer = document.querySelector(".player-hand");

        if (!p1HandContainer || !p2HandContainer) throw new Error("Player hand containers not found in the DOM.");

        // Initialize decks and hands
        p1Deck = buildDeck();
        p2Deck = buildDeck();
        p1Hand = p1Deck.splice(0, window.gameConfig.gameSettings.maxHandSize);
        p2Hand = p2Deck.splice(0, window.gameConfig.gameSettings.maxHandSize);
        p1BZ = [];
        p2BZ = [];
        currentPlayer = "p1";
        currentPhase = batSys.turnStructure?.[0]?.turn || "deploy";

        console.log(`Deck sizes: P1 - ${p1Deck.length}, P2 - ${p2Deck.length}`);
        console.log("Player 1 Hand:", p1Hand);
        console.log("Player 2 Hand:", p2Hand);

        // Render hands using new container variables
        renderHand(p1Hand, p1HandContainer, "p1");
        renderHand(p2Hand, p2HandContainer, "p2");

        // Clear battle zones
        ["p1BZ", "p2BZ"].forEach(zone => {
            const element = document.querySelector(`.${zone}`);
            if (element) element.innerHTML = "";
        });

        // Enable play button
        document.getElementById("play-turn-btn")?.removeAttribute("disabled");

        // Start the turn system
        handleTurn();
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}


//TURN HANDLING
//
async function handleDeploymentPhase() {
    if (turnStep === 0) {
        logBattleEvent("Your turn: Play a card");
        enableHandInteract("p1");
        turnStep = 1;
    } else {
        await doAiDeploy();
        advancePhase("attack");
    }
}
//
async function handleAttackPhase() {
    if (turnStep === 0) {
        if (p1BZ.length && p2BZ.length) {
            logBattleEvent("Select your attacker");
            initPlayerAttackSystem();
            turnStep = 1;
        } else {
            advancePhase("draw");
        }
    } else {
        if (p2BZ.length && p1BZ.length) {
            await doAiAttack();
        }
        advancePhase("draw");
    }
}
//
function handleDrawPhase() {
    drawCard(p1Hand, p1Deck);
    drawCard(p2Hand, p2Deck);
    advancePhase("deploy");
}
//
function advancePhase(nextPhase) {
    currentPhase = nextPhase;
    turnStep = 0;
    handleTurn();
}
//
async function handleTurn() {
    switch (currentPhase) {
        case "deploy":
            await handleDeploymentPhase();
            break;
        case "attack":
            await handleAttackPhase();
            break;
        case "draw":
            handleDrawPhase();
            break;
    }
    checkWinConditions();
}
//
function logBattleEvent(message) {
    const logContainer = getElementSafe("results-log");
    if (!logContainer) return;
    const logEntry = document.createElement("div");
    logEntry.classList.add("log-entry");
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}
//
function enableHandInteract(player) {
    const handId = player === "p1" ? "p1-hand" : "p2-hand";
    const battleZoneId = player === "p1" ? "p1BZ" : "p2BZ";
    const handContainer = getElementSafe(handId);
    if (!handContainer) return;
    handContainer.querySelectorAll(".card").forEach(cardEl => {
        cardEl.style.cursor = "pointer";
        cardEl.onclick = () => {
            const card = getCardFromElement(cardEl);
            if (!card) return;
            playCard(
                card,
                player === "p1" ? p1Hand : p2Hand,
                player === "p1" ? p1BZ : p2BZ,
                battleZoneId
            );
            if (player === "p1") handleTurn();
        };
    });
}
//
function validateCardPlay(card, battleZone) {
    if (!card || !battleZone) return false;

    if (battleZone.length === 0) return true; // If the battle zone is empty, any card can be played

    return battleZone.some(existingCard => {
        if (card.type === "char") {
            return existingCard.type === "act" &&
                ((existingCard.sub === "classCards" && existingCard.classes?.some(cls => card.classes?.includes(cls))) ||
                 (existingCard.sub === "element" && (Array.isArray(card.element) ? card.element.includes(existingCard.element) : card.element === existingCard.element)));
        } else if (card.type === "act") {
            return existingCard.type === "char" &&
                ((card.sub === "classCards" && existingCard.classes?.some(cls => card.classes?.includes(cls))) ||
                 (card.sub === "elemCards" && (Array.isArray(existingCard.element) ? existingCard.element.includes(card.element) : existingCard.element === card.element)));
        }
        return false;
    });
}
//
async function doAiDeploy() {
    if (!window.gameConfig?.gameSettings?.maxBZSize) {
        console.error("Game configuration is missing battle zone size settings.");
        return;
    }

    if (!p2Hand || !p2BZ) {
        console.error("p2Hand or p2BZ is not defined.");
        return;
    }

    if (p2Hand.length > 0 && p2BZ.length < window.gameConfig.gameSettings.maxBZSize) {
        const playableCards = p2Hand.filter(card => validateCardPlay(card, p2BZ));
        if (playableCards.length > 0) {
            const chosenCard = playableCards[Math.floor(Math.random() * playableCards.length)];
            await new Promise(resolve => setTimeout(resolve, window.gameConfig?.aiSettings?.moveDelay || 1000));
            playCard(chosenCard, p2Hand, p2BZ, "p2BZ");
        } else {
            console.warn("AI has no playable cards.");
        }
    }
}
//
function playCard(card, playerHand, playerBZ, battleZoneId) {
    if (!card || !playerHand || !playerBZ || !battleZoneId) {
        console.error("playCard function received undefined arguments.");
        return;
    }

    const cardIndex = playerHand.indexOf(card);
    if (cardIndex === -1) {
        console.log("Card not found in hand!");
        return;
    }

    playerHand.splice(cardIndex, 1);
    playerBZ.push(card);
    
    renderBZ(playerBZ, battleZoneId);
    renderHand(
        playerHand,
        playerHand === p1Hand ? "p1-hand" : "p2-hand",
        playerHand === p1Hand ? "p1" : "p2"
    );
}
// ============= ATTACK SYSTEM =============
//
function initPlayerAttackSystem() {
    console.log("🔵 initPlayerAttackSystem() is running!");
    const battleZone = getElementSafe("p1BZ");
    
    if (!battleZone) {
        console.error("❌ ERROR: p1BZ not found!");
        return;
    }

    const cards = battleZone.querySelectorAll(".mini-card");
    console.log(`🟡 Found ${cards.length} cards in your battlezone.`);

    cards.forEach(cardEl => {
        const card = getCardFromElement(cardEl);
        console.log(`🟢 Checking card: ${card?.name}, ATK: ${card?.atk}`);

        if (card?.atk > 0) {
            cardEl.classList.add("selectable");
            console.log(`✅ ${card.name} marked as selectable!`);
            cardEl.onclick = () => handlePlayerAttackSelection(cardEl);
        }
    });
}
//
function handlePlayerAttackSelection(cardEl) {
    const attacker = getCardFromElement(cardEl);
    if (!attacker || selectedAttacker) return;

    selectedAttacker = attacker;
    clearSelections(".selectable");

    getElementSafe("p2BZ")?.querySelectorAll(".mini-card").forEach(targetEl => {
        const defender = getCardFromElement(targetEl);
        if (defender) {
            targetEl.classList.add("targetable");
            targetEl.onclick = () => {
                resolveCombat(selectedAttacker, defender);
                selectedAttacker = null;
                clearSelections(".targetable");
                handleTurn();
            };
        }
    });
}
//
function clearSelections(selector) {
    document.querySelectorAll(selector).forEach(el => el.classList.remove(selector.substring(1)));
}
// ============= CARD DRAWING =============
//
function drawCard(hand, deck) {
    if (deck.length > 0) {
        hand.push(deck.shift());
    }
    renderHand(hand, hand === p1Hand ? "p1-hand" : "p2-hand", hand === p1Hand ? "p1" : "p2");
}
//
// ============= AI ATTACK LOGIC =============
async function doAiAttack() {
    if (!p2BZ.length || !p1BZ.length) return;

    const attackers = p2BZ.filter(c => c.atk > 0);
    if (!attackers.length) return;

    const attacker = attackers[Math.floor(Math.random() * attackers.length)];
    const targets = p1BZ.filter(c => c.hp > 0);
    if (!targets.length) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    logBattleEvent(`AI attacks with ${attacker.name} targeting ${target.name}!`);
    resolveCombat(attacker, target);
    checkWinConditions();
}
//
function getElementBonus(attacker, defender) {
    if (!window.batSys || !window.batSys.elementBonuses) return 1; // Default: No bonus
    
    let bonuses = window.batSys.elementBonuses;
    
    if (bonuses[attacker.element]?.strongAgainst === defender.element) return 1.2; // Strong element
    if (bonuses[attacker.element]?.weakAgainst === defender.element) return 0.8;  // Weak element
    
    return 1; // Neutral element
}
//
function getClassBonus(attacker, defender) {
    if (!window.batSys || !window.batSys.classBonuses) return 1; // Default: No bonus
    
    let bonuses = window.batSys.classBonuses;
    
    if (bonuses[attacker.class]?.strongAgainst.includes(defender.class)) return 1.2; // Strong class
    if (bonuses[attacker.class]?.weakAgainst.includes(defender.class)) return 0.8;  // Weak class
    
    return 1; // Neutral class
}
//
function resolveCombat(attacker, defender) {
    if (!attacker || !defender) {
        console.error("resolveCombat called with invalid attacker or defender:", attacker, defender);
        return;
    }

    let baseDamage = Math.max(attacker.atk - defender.def, 0);
    let elementBonus = getElementBonus(attacker, defender);
    let classBonus = getClassBonus(attacker, defender);
    let totalDamage = Math.floor(baseDamage * elementBonus * classBonus);

    defender.hp = Math.max(defender.hp - totalDamage, 0);
    logBattleEvent(`${attacker.name} attacks ${defender.name} for ${totalDamage} damage!`);

    if (defender.hp === 0) {
        removeDestroyedCard(defender);
        logBattleEvent(`${defender.name} was destroyed!`);
    }

    updateBZs();
}
//
function checkWinConditions() {
    const p1Lost = p1BZ.length === 0 && p1Hand.length === 0 && p1Deck.length === 0;
    const p2Lost = p2BZ.length === 0 && p2Hand.length === 0 && p2Deck.length === 0;

    if (p1Lost) {
        endGame("Player 2");
    } else if (p2Lost) {
        endGame("Player 1");
    }
}
//
function removeDestroyedCard(card) {
    // Check if the card exists in Player 1's Battle Zone
    let index = p1BZ.indexOf(card);
    if (index !== -1) {
        p1BZ.splice(index, 1); // Remove from Player 1's BZ
    }

    // Check if the card exists in Player 2's Battle Zone
    index = p2BZ.indexOf(card);
    if (index !== -1) {
        p2BZ.splice(index, 1); // Remove from Player 2's BZ
    }

    // Update the battle zones to reflect changes
    updateBZs();
}
//
function updateBZs() {
    renderBZ(p1BZ, "p1BZ"); // Update Player 1's battle zone
    renderBZ(p2BZ, "p2BZ"); // Update Player 2's battle zone
}
// ============= GAME END LOGIC =============
function endGame(winner) {
    logBattleEvent(`Game Over! ${winner} wins!`);
    console.log(`Game Over! ${winner} wins!`);
}
//
// ============= EVENT LISTENERS =============
const startGameButton = getElementSafe("start-game");
if (startGameButton) startGameButton.addEventListener("click", initGame);

const playTurnButton = getElementSafe("play-turn");
if (playTurnButton) playTurnButton.addEventListener("click", handleTurn);

//

export { initGame, handleTurn, shuffleDeck };
