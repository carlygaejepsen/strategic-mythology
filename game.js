let p1Deck = [];
let p2Deck = [];
let p1BZ = [];
let p2BZ = [];
let p1Hand = [];
let p2Hand = [];
let currentPlayer = "p1";
let currentPhase = "deploy";
let turnStep = 0;
let selectedAttacker = null;

let elementEmojis = {};
let batSys = {};

async function loadGameData() {
    const jsonFiles = [
        "water-chars.json", "elem-cards.json", "bat-sys.json", "beast-chars.json",
        "bully-chars.json", "celestial-chars.json", "char-desc.json", "class-cards.json",
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

async function loadBatSys() {
    try {
        const response = await fetch("./data/bat-sys.json");
        if (!response.ok) throw new Error("Failed to load bat-sys.json");
        batSys = await response.json();
    } catch (error) {
        console.error("Error loading battle system:", error);
    }
}
function getElementSafe(id) {
    return document.getElementById(id) || null;
}
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}
function buildDeck() {
    if (!window.allCards) return [];
    return shuffleDeck(window.allCards.filter(
        card => card.type === "char" || card.sub === "element" || card.sub === "class"
    ));
}

async function initGame() {
    try {
        console.log("Initializing game...");
        await Promise.all([loadGameConfig(), loadGameData(), loadBatSys()]);

        if (!batSys?.turnStructure) {
            throw new Error("Battle system data is missing or failed to load.");
        }

        if (!window.gameConfig?.gameSettings?.maxHandSize) {
            throw new Error("Game configuration is missing hand size settings.");
        }

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

        renderHand(p1Hand, "p1-hand", "p1");
        renderHand(p2Hand, "p2-hand", "p2");

        ["p1-battlezone", "p2-battlezone"].forEach(zone => {
            const element = getElementSafe(zone);
            if (element) element.innerHTML = "";
        });

        getElementSafe("play-turn-btn")?.removeAttribute("disabled");

        handleTurn();
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}

function logBattleEvent(message) {
    const logContainer = getElementSafe("results-log");
    if (!logContainer) return;
    const logEntry = document.createElement("div");
    logEntry.classList.add("log-entry");
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function enableHandInteract(player) {
    const handId = player === "p1" ? "p1-hand" : "p2-hand";
    const battleZoneId = player === "p1" ? "p1-battlezone" : "p2-battlezone";
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
            playCard(chosenCard, p2Hand, p2BZ, "p2-battlezone");
        } else {
            console.warn("AI has no playable cards.");
        }
    }
}

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

function renderHand(hand, containerId, whichPlayer) {
    const container = getElementSafe(containerId);
    if (!container) return;
    container.innerHTML = "";
    hand.forEach(card => {
        const cardElement = createCardElement(card);
        if (whichPlayer === "p1") {
            cardElement.addEventListener("click", () => {
                playCard(card, p1Hand, p1BZ, "p1-battlezone");
                renderHand(p1Hand, containerId, whichPlayer);
            });
        }
        container.appendChild(cardElement);
    });
}
// ============= ATTACK SYSTEM =============
function initPlayerAttackSystem() {
    getElementSafe("p1-battlezone")?.querySelectorAll(".mini-card").forEach(cardEl => {
        const card = getCardFromElement(cardEl);
        if (card?.atk > 0) {
            cardEl.classList.add("selectable");
            cardEl.onclick = () => handlePlayerAttackSelection(cardEl);
        }
    });
}

function handlePlayerAttackSelection(cardEl) {
    const attacker = getCardFromElement(cardEl);
    if (!attacker || selectedAttacker) return;

    selectedAttacker = attacker;
    clearSelections(".selectable");

    getElementSafe("p2-battlezone")?.querySelectorAll(".mini-card").forEach(targetEl => {
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

function clearSelections(selector) {
    document.querySelectorAll(selector).forEach(el => el.classList.remove(selector.substring(1)));
}
// ============= CARD DRAWING =============
function drawCard(hand, deck) {
    if (deck.length > 0) {
        hand.push(deck.shift());
    }
    renderHand(hand, hand === p1Hand ? "p1-hand" : "p2-hand", hand === p1Hand ? "p1" : "p2");
}

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

// ============= EVENT LISTENERS =============
const startGameButton = getElementSafe("start-game");
if (startGameButton) startGameButton.addEventListener("click", initGame);

const playTurnButton = getElementSafe("play-turn");
if (playTurnButton) playTurnButton.addEventListener("click", handleTurn);

// ============= GAME END LOGIC =============
function endGame(winner) {
    logBattleEvent(`Game Over! ${winner} wins!`);
    console.log(`Game Over! ${winner} wins!`);
}
