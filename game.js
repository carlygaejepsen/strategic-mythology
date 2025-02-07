let elementEmojis = {};
let battleSystem = {}; // Store battle system data

async function loadBattleSystem() {
    try {
        const response = await fetch("bat-sys.json"); // Load from the correct path
        if (!response.ok) throw new Error("Failed to load bat-sys.json");
        battleSystem = await response.json();
    } catch (error) {
        console.error("Error loading battle system:", error);
    }
}


async function loadGameConfig() {
    try {
        const response = await fetch("./data/game-config.json");
        if (!response.ok) throw new Error("Failed to load game-config.json");
        const config = await response.json();
        elementEmojis = config.elementEmojis;
    } catch (error) {
        console.error("Error loading game config:", error);
    }
}

// ============= DATA LOADING =============
async function loadGameData() {
    const jsonFiles = [
        "water-chars.json",
        "elem-cards.json",
        "bat-sys.json",
        "beast-chars.json",
        "bully-chars.json",
        "celestial-chars.json",
		"char-desc.json",
		"class-cards.json",
        "game-config.json",
        "hero-chars.json",
        "life-chars.json",
        "mystical-chars.json",
        "olympian-chars.json",
		"plant-chars.json",
        "underworld-chars.json"
    ];

    const basePath = "https://carlygaejepsen.github.io/strategic-mythology/data/";

    try {
        // Fetch all JSON files in parallel
        const responses = await Promise.all(jsonFiles.map(file => fetch(basePath + file)));

        // Check if any fetch requests failed
        responses.forEach((res, index) => {
            if (!res.ok) {
                throw new Error(`Failed to load ${jsonFiles[index]}`);
            }
        });

        // Parse all JSON responses
        const data = await Promise.all(responses.map(res => res.json()));

        // Map data to corresponding variables
        const [
            waterChars, 
            actionCards, 
            batSys, 
            beastChars, 
            bullyChars, 
            celestialChars, 
            gameConfig, 
            heroChars, 
            lifeChars, 
            mysticalChars, 
            olympianChars, 
            underworldChars
        ] = data;

        // Store them into a gameData object for easier access
        gameData = {
            waterChars,
            elemCards,
			classCards,
            batSys,
            beastChars,
            bullyChars,
            celestialChars,
            gameConfig,
            heroChars,
            lifeChars,
            mysticalChars,
            olympianChars,
			plantChars,
            underworldChars
        };

        console.log("All game data loaded successfully!", gameData);
    } catch (error) {
        console.error("Error loading game data:", error);
    }
}

// Call the function to load data
loadGameData();

// ============= HELPER FUNCTIONS =============
// Returns a DOM element or logs an error if not found.
function getElementSafe(id) {
  const el = document.getElementById(id);
  if (!el) console.error(`Element with id "${id}" not found!`);
  return el;
}

function buildDeck() {
  return shuffleDeck(
    allCards.filter(
      (card) =>
        card.type === "char" ||
        card.sub === "elemCards" ||
        card.sub === "classCards"
    )
  );
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
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
  const battleZoneId =
    player === "p1" ? "p1-battlezone" : "p2-battlezone";
  const handContainer = getElementSafe(handId);
  if (!handContainer) return;
  handContainer.querySelectorAll(".card").forEach((cardEl) => {
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
  if (p2Hand.length > 0 && p2BZ.length < 3) {
    const playableCards = p2Hand.filter((card) =>
      validateCardPlay(card, p2BZ)
    );
    if (playableCards.length > 0) {
      const chosenCard =
        playableCards[Math.floor(Math.random() * playableCards.length)];
	await new Promise((resolve) => setTimeout(resolve, gameConfig.aiSettings.moveDelay));
      playCard(chosenCard, p2Hand, p2BZ, "p2-battlezone");
    } else {
      console.warn("AI has no playable cards.");
    }
  }
}

function playCard(card, playerHand, playerBZ, battleZoneId) {
	if (playerBZ.length >= gameConfig.gameSettings.maxBZSize) {
		console.warn(`Battle zone is full! Cannot play more than ${gameConfig.gameSettings.maxBZSize} cards.`);
		return;
	}

	if (playerBZ.length > 0) {
    const hasValidMatch = playerBZ.some((existingCard) => {
      if (card.type === "char") {
        return (
          existingCard.type === "act" &&
          ((existingCard.sub === "classCards" &&
            existingCard.classes.some((cls) => card.classes.includes(cls))) ||
            (existingCard.sub === "element" &&
              Array.isArray(card.element)
                ? card.element.includes(existingCard.element)
                : card.element === existingCard.element))
        );
      } else if (card.type === "act") {
        return (
          existingCard.type === "char" &&
          ((card.sub === "classCards" &&
            existingCard.classes.some((cls) => card.classes.includes(cls))) ||
            (card.sub === "elemCards" &&
              Array.isArray(existingCard.element)
                ? existingCard.element.includes(card.element)
                : existingCard.element === card.element))
        );
      }
      return false;
    });
    if (!hasValidMatch) {
      console.warn(`Cannot play ${card.name}. No matching character or action.`);
      return;
    }
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
  hand.forEach((card) => {
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

function createCardElement(card) {
  const cardDiv = document.createElement("div");
  cardDiv.classList.add("card");

  // Name with Element Emoji
  const nameElement = document.createElement("div");
  nameElement.classList.add("card-name");

  const nameText = document.createElement("span");
  nameText.textContent = card.name;
  nameText.classList.add("card-name-text");

  const elementEmojiSpan = document.createElement("span");
  elementEmojiSpan.classList.add("card-elements");
  if (card.element) {
    if (Array.isArray(card.element)) {
      elementEmojiSpan.innerHTML =
        " " +
        card.element
          .map((el) => elementEmojis[el] || "")
          .filter(Boolean)
          .join(" ");
    } else {
      elementEmojiSpan.innerHTML = " " + (elementEmojis[card.element] || "");
    }
  }
  nameElement.appendChild(nameText);
  nameElement.appendChild(elementEmojiSpan);
  cardDiv.appendChild(nameElement);

  // Image
  if (card.img) {
    const imgElement = document.createElement("img");
    imgElement.src = card.img;
    imgElement.alt = card.name;
    imgElement.classList.add("card-img");
    cardDiv.appendChild(imgElement);
  }

  // Type & Attributes
  const attributesElement = document.createElement("div");
  attributesElement.classList.add("card-attributes");
  if (card.classes?.length > 0) {
    attributesElement.textContent = `${card.classes.join(", ")}`;
  }
  cardDiv.appendChild(attributesElement);

  // Stats
  if (card.hp || card.atk || card.def) {
    const statsElement = document.createElement("div");
    statsElement.classList.add("card-stats");
    statsElement.innerHTML = `❤️: ${card.hp || 0} ⚔️: ${card.atk || 0} 🛡️: ${card.def || 0}`;
    cardDiv.appendChild(statsElement);
  }

  // Description
  if (card.desc) {
    const descElement = document.createElement("div");
    descElement.classList.add("card-desc");
    descElement.textContent = card.desc;
    cardDiv.appendChild(descElement);
  }
  return cardDiv;
}

function renderBZ(playerBZ, containerId) {
  const container = getElementSafe(containerId);
  if (!container) return;
  container.innerHTML = "";
  playerBZ.forEach((card) => {
    const miniCard = document.createElement("div");
    miniCard.classList.add("mini-card");

    // Card Name
    const nameElement = document.createElement("div");
    nameElement.classList.add("mini-card-name");
    nameElement.textContent = card.name;
    miniCard.appendChild(nameElement);

    // Card Image (if available)
    if (card.img) {
      const imgElement = document.createElement("img");
      imgElement.src = card.img;
      imgElement.alt = card.name;
      imgElement.classList.add("mini-card-img");
      miniCard.appendChild(imgElement);
    }

    // Display Elements (if available)
    if (card.element) {
      const elements = Array.isArray(card.element) ? card.element : [card.element];
      const elementIcons = elements
        .map((el) => elementEmojis[el] || "")
        .filter(Boolean)
        .join(" ");
      if (elementIcons) {
        const elementElement = document.createElement("div");
        elementElement.classList.add("mini-card-elements");
        elementElement.textContent = elementIcons;
        miniCard.appendChild(elementElement);
      }
    }

    // Display Classes (if available)
    if (card.classes?.length > 0) {
      const classElement = document.createElement("div");
      classElement.classList.add("mini-card-classes");
      classElement.textContent = card.classes.join(", ");
      miniCard.appendChild(classElement);
    }

    // Display Stats (hp, atk, def)
    if (card.hp || card.atk || card.def) {
      const statsElement = document.createElement("div");
      statsElement.classList.add("mini-card-stats");
      statsElement.innerHTML = `❤️: ${card.hp || 0} ⚔️: ${card.atk || 0} 🛡️: ${card.def || 0}`;
      miniCard.appendChild(statsElement);
    }
    container.appendChild(miniCard);
  });
}

async function doAiMove() {
	
	await new Promise(resolve => setTimeout(resolve, gameConfig.aiSettings.moveDelay));

  if (p2Hand.length === 0) {
    console.log("AI (Player 2) has no cards left to play.");
    return;
  }
  let playableCards = p2Hand.filter((card) => {
    if (p2BZ.length === 0) {
      return true; // If battle zone is empty, AI can play anything
    }
    if (card.type === "char") {
      return p2BZ.some((existingCard) =>
        existingCard.type === "act" &&
        ((existingCard.sub === "element" && card.element?.includes(existingCard.element)) ||
          (existingCard.sub === "class" && existingCard.classes?.some((cls) => card.classes?.includes(cls))))
      );
    }
    if (card.type === "act") {
      return p2BZ.some((existingCard) =>
        existingCard.type === "char" &&
        ((card.sub === "element" && existingCard.element?.includes(card.element)) ||
          (card.sub === "class" && card.classes?.some((cls) => existingCard.classes?.includes(cls))))
      );
    }
    return false;
  });
  if (playableCards.length === 0) {
    console.log("AI (Player 2) has no valid cards to play.");
    return;
  }
  const chosenCard =
    playableCards[Math.floor(Math.random() * playableCards.length)];
  logBattleEvent(`AI played ${chosenCard.name}!`);
  playCard(chosenCard, p2Hand, p2BZ, "p2-battlezone");
  renderHand(p2Hand, "p2-hand", "p2");
}

// ============= BATTLE SYSTEM =============
function initAttackSystem() {
  selectedAttacker = null;
  currentBattlePhase = "select-attacker";
  addBZListeners();
}

function addBZListeners() {
  const battleZones = {
    "p1-battlezone": "p1",
    "p2-battlezone": "p2"
  };
  Object.entries(battleZones).forEach(([zoneId, player]) => {
    const zone = getElementSafe(zoneId);
    if (zone) {
      zone.querySelectorAll(".mini-card").forEach((cardEl) => {
        cardEl.classList.add("selectable");
        cardEl.onclick = () => handleBattleSelection(cardEl, player);
      });
    }
  });
}

function handleBattleSelection(cardElement, player) {
  const card = getCardFromElement(cardElement);
  if (!card) return;
  if (currentBattlePhase === "select-attacker" && player === currentPlayer) {
    if (card.atk > 0) {
      selectedAttacker = card;
      currentBattlePhase = "select-defender";
      highlightValidTargets();
      logBattleEvent(`${card.name} selected as attacker. Choose target!`);
    }
  } else if (currentBattlePhase === "select-defender" && player !== currentPlayer) {
    resolveCombat(selectedAttacker, card);
    cleanupBattleSelection();
  }
}

function resolveCombat(attacker, defender) {
  if (!attacker || !defender) return;

  let baseDamage = Math.max(attacker.atk - defender.def, 0);
  let elementBonus = calculateElementBonus(attacker, defender);
  let classBonus = calculateClassBonus(attacker, defender);
  
  let totalDamage = baseDamage + elementBonus + classBonus;
  
  defender.hp -= totalDamage;
  
  logBattleEvent(
    `${attacker.name} atks ${defender.name} for ${totalDamage} damage!`
  );

  if (defender.hp <= 0) {
    removeDestroyedCard(defender);
    logBattleEvent(`${defender.name} was destroyed!`);
  }

  updateBZs();
}

function removeDestroyedCard(card) {
  [p1BZ, p2BZ].forEach((battleZone, index) => {
    const cardIndex = battleZone.findIndex((c) => c.name === card.name);
    if (cardIndex !== -1) {
      battleZone.splice(cardIndex, 1);
      renderBZ(battleZone, index === 0 ? "p1-battlezone" : "p2-battlezone");
    }
  });
}

function updateBZs() {
  renderBZ(p1BZ, "p1-battlezone");
  renderBZ(p2BZ, "p2-battlezone");
}


function highlightValidTargets() {
  const enemyBZ = currentPlayer === "p1" ? p2BZ : p1BZ;
  const enemyZoneId = currentPlayer === "p1" ? "p2-battlezone" : "p1-battlezone";
  const enemyZone = getElementSafe(enemyZoneId);

  if (!enemyZone || enemyBZ.length === 0) return;

  enemyZone.querySelectorAll(".mini-card").forEach((cardEl) => {
    cardEl.classList.add("targetable");
  });
}

function cleanupBattleSelection() {
  selectedAttacker = null;
  currentBattlePhase = "select-attacker";

  document.querySelectorAll(".selectable, .targetable").forEach((el) => {
    el.classList.remove("selectable", "targetable");
  });

  addBZListeners();
}

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
    p1BZ.find((card) => card.name === cardName) ||
    p2BZ.find((card) => card.name === cardName) ||
    null
  );
}
// ============= WIN CONDITION CHECKING =============
function checkWinConditions() {
  const p1Lost = p1BZ.length === 0 && p1Hand.length === 0 && p1Deck.length === 0;
  const p2Lost = p2BZ.length === 0 && p2Hand.length === 0 && p2Deck.length === 0;

  if (p1Lost) endGame("p2");
  if (p2Lost) endGame("p1");
}

// ============= TURN HANDLING =============
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

async function handleAttackPhase() {
  if (turnStep === 0) {
    if (p1BZ.length > 0 && p2BZ.length > 0) {
      logBattleEvent("Select your attacker");
      initPlayerAttackSystem();
      turnStep = 1;
    } else {
      advancePhase("draw");
    }
  } else {
    if (p2BZ.length > 0 && p1BZ.length > 0) {
      await doAiAttack();
    }
    advancePhase("draw");
  }
}

function handleDrawPhase() {
  [p1Hand, p1Deck].forEach(drawCard);
  [p2Hand, p2Deck].forEach(drawCard);
  advancePhase("deploy");
}

function advancePhase(nextPhase) {
  currentPhase = nextPhase;
  turnStep = 0;
  handleTurn();
}

// ============= ATTACK SYSTEM =============
function initPlayerAttackSystem() {
  getElementSafe("p1-battlezone")?.querySelectorAll(".mini-card").forEach((cardEl) => {
    const card = getCardFromElement(cardEl);
    if (card?.attack > 0) {
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

  getElementSafe("p2-battlezone")?.querySelectorAll(".mini-card").forEach((targetEl) => {
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
  document.querySelectorAll(selector).forEach((el) => el.classList.remove(selector.substring(1)));
}

// ============= CARD DRAWING =============
function drawCard(hand, deck) {
  if (deck.length > 0) hand.push(deck.shift());
  renderHand(hand, hand === p1Hand ? "p1-hand" : "p2-hand", hand === p1Hand ? "p1" : "p2");
}

// ============= AI ATTACK LOGIC =============
function doAiAttack() {
  const attackers = p2BZ.filter(c => c.attack > 0);
  if (!attackers.length) return;

  const attacker = attackers[Math.floor(Math.random() * attackers.length)];
  const targets = p1BZ.filter(c => c.hp > 0);
  if (!targets.length) return;

  const target = targets[Math.floor(Math.random() * targets.length)];
  logBattleEvent(`AI attacks with ${attacker.name} targeting ${target.name}!`);
  resolveCombat(attacker, target);
  checkWinConditions();
}


// ============= INITIALIZE THE GAME =============
async function initGame() {
  try {
    console.log("Initializing game...");

    // Load configuration and battle system data first
    await Promise.all([loadGameConfig(), loadGameData(), loadBattleSystem()]);

    // Ensure battle system data is loaded before using it
    if (!battleSystem || !battleSystem.turnStructure) {
      throw new Error("Battle system data is missing or failed to load.");
    }

    // Initialize game state
    p1Deck = buildDeck();
    p2Deck = buildDeck();
    p1Hand = p1Deck.splice(0, gameConfig.gameSettings.maxHandSize);
    p2Hand = p2Deck.splice(0, gameConfig.gameSettings.maxHandSize);
    p1BZ = [];
    p2BZ = [];
    currentPlayer = "p1";
    currentPhase = battleSystem.turnStructure[0].turn; // Use first turn phase from bat-sys.json

    console.log(`Deck sizes: P1 - ${p1Deck.length}, P2 - ${p2Deck.length}`);
    console.log("Player 1 Hand:", p1Hand);
    console.log("Player 2 Hand:", p2Hand);

    // Render initial game state
    renderHand(p1Hand, "p1-hand", "p1");
    renderHand(p2Hand, "p2-hand", "p2");

    // Clear battle zones
    ["p1-battlezone", "p2-battlezone"].forEach(zone => {
      const zoneElement = getElementSafe(zone);
      if (zoneElement) zoneElement.innerHTML = "";
    });

    // Ensure the play button exists before modifying it
    const playTurnBtn = getElementSafe("play-turn-btn");
    if (playTurnBtn) playTurnBtn.disabled = false;

    // Start the first turn
    handleTurn();

  } catch (error) {
    console.error("Error initializing game:", error);
  }
}


// ============= EVENT LISTENERS =============
getElementSafe("start-game")?.addEventListener("click", initGame);
getElementSafe("play-turn")?.addEventListener("click", handleTurn);

// ============= GAME END LOGIC =============
function endGame(winner) {
  logBattleEvent(`Game Over! ${winner} wins!`);
  console.log(`Game Over! ${winner} wins!`);
}

initGame();
