let elementEmojis = {};

async function loadGameConfig() {
    try {
        const response = await fetch("path/to/game-config.json");
        if (!response.ok) throw new Error("Failed to load game-config.json");
        const config = await response.json();
        elementEmojis = config.elementEmojis;
    } catch (error) {
        console.error("Error loading game config:", error);
    }
}


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
        card.type === "character" ||
        card.subtype === "element" ||
        card.subtype === "class"
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

function enableHandInteraction(player) {
  const handId = player === "player1" ? "player1-hand" : "player2-hand";
  const battleZoneId =
    player === "player1" ? "player1-battlezone" : "player2-battlezone";
  const handContainer = getElementSafe(handId);
  if (!handContainer) return;
  handContainer.querySelectorAll(".card").forEach((cardEl) => {
    cardEl.style.cursor = "pointer";
    cardEl.onclick = () => {
      const card = getCardFromElement(cardEl);
      if (!card) return;
      playCard(
        card,
        player === "player1" ? player1Hand : player2Hand,
        player === "player1" ? player1BattleZone : player2BattleZone,
        battleZoneId
      );
      if (player === "player1") handleTurn();
    };
  });
}

async function doAiDeploy() {
  if (player2Hand.length > 0 && player2BattleZone.length < 3) {
    const playableCards = player2Hand.filter((card) =>
      validateCardPlay(card, player2BattleZone)
    );
    if (playableCards.length > 0) {
      const chosenCard =
        playableCards[Math.floor(Math.random() * playableCards.length)];
	await new Promise((resolve) => setTimeout(resolve, gameConfig.aiSettings.moveDelay));
      playCard(chosenCard, player2Hand, player2BattleZone, "player2-battlezone");
    } else {
      console.warn("AI has no playable cards.");
    }
  }
}

function playCard(card, playerHand, playerBattleZone, battleZoneId) {
	if (playerBattleZone.length >= gameConfig.gameSettings.maxBattleZoneSize) {
		console.warn(`Battle zone is full! Cannot play more than ${gameConfig.gameSettings.maxBattleZoneSize} cards.`);
		return;
	}

	if (playerBattleZone.length > 0) {
    const hasValidMatch = playerBattleZone.some((existingCard) => {
      if (card.type === "character") {
        return (
          existingCard.type === "action" &&
          ((existingCard.subtype === "class" &&
            existingCard.classes.some((cls) => card.classes.includes(cls))) ||
            (existingCard.subtype === "element" &&
              Array.isArray(card.element)
                ? card.element.includes(existingCard.element)
                : card.element === existingCard.element))
        );
      } else if (card.type === "action") {
        return (
          existingCard.type === "character" &&
          ((card.subtype === "class" &&
            existingCard.classes.some((cls) => card.classes.includes(cls))) ||
            (card.subtype === "element" &&
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
  playerBattleZone.push(card);
  renderBattleZone(playerBattleZone, battleZoneId);
  renderHand(
    playerHand,
    playerHand === player1Hand ? "player1-hand" : "player2-hand",
    playerHand === player1Hand ? "player1" : "player2"
  );
}

function renderHand(hand, containerId, whichPlayer) {
  const container = getElementSafe(containerId);
  if (!container) return;
  container.innerHTML = "";
  hand.forEach((card) => {
    const cardElement = createCardElement(card);
    if (whichPlayer === "player1") {
      cardElement.addEventListener("click", () => {
        playCard(card, player1Hand, player1BattleZone, "player1-battlezone");
        renderHand(player1Hand, containerId, whichPlayer);
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
  if (card.image) {
    const imgElement = document.createElement("img");
    imgElement.src = card.image;
    imgElement.alt = card.name;
    imgElement.classList.add("card-image");
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
  if (card.description) {
    const descriptionElement = document.createElement("div");
    descriptionElement.classList.add("card-description");
    descriptionElement.textContent = card.description;
    cardDiv.appendChild(descriptionElement);
  }
  return cardDiv;
}

function renderBattleZone(playerBattleZone, containerId) {
  const container = getElementSafe(containerId);
  if (!container) return;
  container.innerHTML = "";
  playerBattleZone.forEach((card) => {
    const miniCard = document.createElement("div");
    miniCard.classList.add("mini-card");

    // Card Name
    const nameElement = document.createElement("div");
    nameElement.classList.add("mini-card-name");
    nameElement.textContent = card.name;
    miniCard.appendChild(nameElement);

    // Card Image (if available)
    if (card.image) {
      const imgElement = document.createElement("img");
      imgElement.src = card.image;
      imgElement.alt = card.name;
      imgElement.classList.add("mini-card-image");
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

    // Display Stats (HP, ATK, DEF)
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

  if (player2Hand.length === 0) {
    console.log("AI (Player 2) has no cards left to play.");
    return;
  }
  let playableCards = player2Hand.filter((card) => {
    if (player2BattleZone.length === 0) {
      return true; // If battle zone is empty, AI can play anything
    }
    if (card.type === "character") {
      return player2BattleZone.some((existingCard) =>
        existingCard.type === "action" &&
        ((existingCard.subtype === "element" && card.element?.includes(existingCard.element)) ||
          (existingCard.subtype === "class" && existingCard.classes?.some((cls) => card.classes?.includes(cls))))
      );
    }
    if (card.type === "action") {
      return player2BattleZone.some((existingCard) =>
        existingCard.type === "character" &&
        ((card.subtype === "element" && existingCard.element?.includes(card.element)) ||
          (card.subtype === "class" && card.classes?.some((cls) => existingCard.classes?.includes(cls))))
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
  playCard(chosenCard, player2Hand, player2BattleZone, "player2-battlezone");
  renderHand(player2Hand, "player2-hand", "player2");
}

// ============= BATTLE SYSTEM =============
function initAttackSystem() {
  selectedAttacker = null;
  currentBattlePhase = "select-attacker";
  addBattleZoneListeners();
}

function addBattleZoneListeners() {
  const battleZones = {
    "player1-battlezone": "player1",
    "player2-battlezone": "player2"
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
    `${attacker.name} attacks ${defender.name} for ${totalDamage} damage!`
  );

  if (defender.hp <= 0) {
    removeDestroyedCard(defender);
    logBattleEvent(`${defender.name} was destroyed!`);
  }

  updateBattleZones();
}

function removeDestroyedCard(card) {
  [player1BattleZone, player2BattleZone].forEach((battleZone, index) => {
    const cardIndex = battleZone.findIndex((c) => c.name === card.name);
    if (cardIndex !== -1) {
      battleZone.splice(cardIndex, 1);
      renderBattleZone(battleZone, index === 0 ? "player1-battlezone" : "player2-battlezone");
    }
  });
}

function updateBattleZones() {
  renderBattleZone(player1BattleZone, "player1-battlezone");
  renderBattleZone(player2BattleZone, "player2-battlezone");
}


function highlightValidTargets() {
  const enemyBattleZone = currentPlayer === "player1" ? player2BattleZone : player1BattleZone;
  const enemyZoneId = currentPlayer === "player1" ? "player2-battlezone" : "player1-battlezone";
  const enemyZone = getElementSafe(enemyZoneId);

  if (!enemyZone || enemyBattleZone.length === 0) return;

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

  addBattleZoneListeners();
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
    player1BattleZone.find((card) => card.name === cardName) ||
    player2BattleZone.find((card) => card.name === cardName) ||
    null
  );
}
// ============= WIN CONDITION CHECKING =============
function checkWinConditions() {
  const player1Lost = player1BattleZone.length === 0 && player1Hand.length === 0 && player1Deck.length === 0;
  const player2Lost = player2BattleZone.length === 0 && player2Hand.length === 0 && player2Deck.length === 0;

  if (player1Lost) endGame("player2");
  if (player2Lost) endGame("player1");
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
    enableHandInteraction("player1");
    turnStep = 1;
  } else {
    await doAiDeploy();
    advancePhase("attack");
  }
}

async function handleAttackPhase() {
  if (turnStep === 0) {
    if (player1BattleZone.length > 0 && player2BattleZone.length > 0) {
      logBattleEvent("Select your attacker");
      initPlayerAttackSystem();
      turnStep = 1;
    } else {
      advancePhase("draw");
    }
  } else {
    if (player2BattleZone.length > 0 && player1BattleZone.length > 0) {
      await doAiAttack();
    }
    advancePhase("draw");
  }
}

function handleDrawPhase() {
  [player1Hand, player1Deck].forEach(drawCard);
  [player2Hand, player2Deck].forEach(drawCard);
  advancePhase("deploy");
}

function advancePhase(nextPhase) {
  currentPhase = nextPhase;
  turnStep = 0;
  handleTurn();
}

// ============= ATTACK SYSTEM =============
function initPlayerAttackSystem() {
  getElementSafe("player1-battlezone")?.querySelectorAll(".mini-card").forEach((cardEl) => {
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

  getElementSafe("player2-battlezone")?.querySelectorAll(".mini-card").forEach((targetEl) => {
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
  renderHand(hand, hand === player1Hand ? "player1-hand" : "player2-hand", hand === player1Hand ? "player1" : "player2");
}

// ============= AI ATTACK LOGIC =============
function doAiAttack() {
  const attackers = player2BattleZone.filter(c => c.atk > 0);
  if (!attackers.length) return;

  const attacker = attackers[Math.floor(Math.random() * attackers.length)];
  const targets = player1BattleZone.filter(c => c.hp > 0);
  if (!targets.length) return;

  const target = targets[Math.floor(Math.random() * targets.length)];
  logBattleEvent(`AI attacks with ${attacker.name} targeting ${target.name}!`);
  resolveCombat(attacker, target);
  checkWinConditions();
}

// ============= DATA LOADING =============
async function loadGameData() {
  try {
    const gameDataResponses = await Promise.all([
      fetch("https://carlygaejepsen.github.io/strategic-mythology/data/character-cards.json"),
      fetch("https://carlygaejepsen.github.io/strategic-mythology/data/action-cards.json"),
      fetch("https://carlygaejepsen.github.io/strategic-mythology/data/battle-system.json")
    ]);

    if (gameDataResponses.some(res => !res.ok)) {
      throw new Error("Failed to load one or more game data files.");
    }

    const [charactersData, actionCardsData, battleSystemData] = await Promise.all(
      gameDataResponses.map(res => res.json())
    );

    characters = charactersData || [];
    actionCards = actionCardsData || {};
    battleSystem = battleSystemData || {};

    allCards = [...characters, ...(actionCards.elementActions || []), ...(actionCards.classActions || [])];

    console.log("Game data loaded successfully!");
  } catch (error) {
    console.error("Critical error loading game data:", error);
  }
}

// ============= INITIALIZE THE GAME =============
async function initGame() {
  try {
    console.log("Initializing game...");

    // Reset game state
    player1Deck = [];
    player2Deck = [];
    player1Hand = [];
    player2Hand = [];
    player1BattleZone = [];
    player2BattleZone = [];
    currentPlayer = "player1";
    currentPhase = "deploy";

    // Load configuration and game data
    await Promise.all([loadGameConfig(), loadGameData()]);

    // Build decks and hands
    player1Deck = buildDeck();
    player2Deck = buildDeck();

    player1Hand = player1Deck.splice(0, gameConfig.gameSettings.maxHandSize);
    player2Hand = player2Deck.splice(0, gameConfig.gameSettings.maxHandSize);

    console.log(`Deck sizes: P1 - ${player1Deck.length}, P2 - ${player2Deck.length}`);
    console.log("Player 1 Hand:", player1Hand);
    console.log("Player 2 Hand:", player2Hand);

    // Render initial game state
    renderHand(player1Hand, "player1-hand", "player1");
    renderHand(player2Hand, "player2-hand", "player2");

    ["player1-battlezone", "player2-battlezone"].forEach(zone => {
      const zoneElement = getElementSafe(zone);
      if (zoneElement) zoneElement.innerHTML = "";
    });

    if (playTurnBtn) playTurnBtn.disabled = false;
  } catch (error) {
    console.error("Error initializing game:", error);
  }
  handleTurn();
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
