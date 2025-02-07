let p1Deck = [];
let p2Deck = [];
let p1BZ = [];
let p2BZ = [];
let elementEmojis = {};
let batSys = {}; // Store battle system data

async function loadGameConfig() {
    try {
        const response = await fetch("./data/game-config.json");
        if (!response.ok) throw new Error("Failed to load game-config.json");
        const config = await response.json();
        elementEmojis = config.elementEmojis || {};
        window.gameConfig = config;
    } catch (error) {
        console.error("Error loading game config:", error);
    }
}

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

        console.log("All game data loaded successfully!", window.gameData);
    } catch (error) {
        console.error("Error loading game data:", error);
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

function buildDeck() {
    if (!window.allCards) {
        console.error("allCards is not defined");
        return [];
    }
    return shuffleDeck(
        window.allCards.filter(
            (card) => card.type === "char" || card.sub === "elemCards" || card.sub === "classCards"
        )
    );
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
				if (element) {
				element.innerHTML = "";
}

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
  if (!gameConfig?.gameSettings?.maxBZSize) {
    console.error("Game configuration is missing battle zone size settings.");
    return;
  }

  if (!p2Hand || !p2BZ) {
    console.error("p2Hand or p2BZ is not defined.");
    return;
  }

  if (p2Hand.length > 0 && p2BZ.length < gameConfig.gameSettings.maxBZSize) {
    const playableCards = p2Hand.filter((card) => validateCardPlay(card, p2BZ));
    if (playableCards.length > 0) {
      const chosenCard = playableCards[Math.floor(Math.random() * playableCards.length)];
      await new Promise((resolve) => setTimeout(resolve, gameConfig?.aiSettings?.moveDelay || 1000));
      playCard(chosenCard, p2Hand, p2BZ, "p2-battlezone");
    } else {
      console.warn("AI has no playable cards.");
    }
  }
}

function playCard(card, playerHand, playerBZ, battleZoneId) {
  if (!gameConfig?.gameSettings?.maxBZSize) {
    console.error("Game configuration is missing battle zone size settings.");
    return;
  }
  
  if (!playerHand || !playerBZ) {
    console.error("playerHand or playerBZ is not defined.");
    return;
  }

  if (playerBZ.length >= gameConfig.gameSettings.maxBZSize) {
    console.warn(`Battle zone is full! Cannot play more than ${gameConfig.gameSettings.maxBZSize} cards.`);
    return;
  }

  if (playerBZ.length > 0) {
    const hasValidMatch = playerBZ.some((existingCard) => {
      if (card.type === "char") {
        return (
          existingCard.type === "act" &&
          ((existingCard.sub === "classCards" && existingCard.classes?.some((cls) => card.classes?.includes(cls))) ||
            (existingCard.sub === "element" && (Array.isArray(card.element) ? card.element.includes(existingCard.element) : card.element === existingCard.element)))
        );
      } else if (card.type === "act") {
        return (
          existingCard.type === "char" &&
          ((card.sub === "classCards" && existingCard.classes?.some((cls) => card.classes?.includes(cls))) ||
            (card.sub === "elemCards" && (Array.isArray(existingCard.element) ? existingCard.element.includes(card.element) : existingCard.element === card.element)))
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



  if (!gameConfig?.gameSettings?.maxBZSize) {
    console.error("Game configuration is missing battle zone size settings.");
    return;
  }
  
  if (playerBZ.length >= gameConfig.gameSettings.maxBZSize) {
    console.warn(`Battle zone is full! Cannot play more than ${gameConfig.gameSettings.maxBZSize} cards.`);
    return;
  }

  if (playerBZ.length > 0) {
    const hasValidMatch = playerBZ.some((existingCard) => {
      if (card.type === "char") {
        return (
          existingCard.type === "act" &&
          ((existingCard.sub === "classCards" && existingCard.classes.some((cls) => card.classes.includes(cls))) ||
            (existingCard.sub === "element" && (Array.isArray(card.element) ? card.element.includes(existingCard.element) : card.element === existingCard.element)))
        );
      } else if (card.type === "act") {
        return (
          existingCard.type === "char" &&
          ((card.sub === "classCards" && existingCard.classes.some((cls) => card.classes.includes(cls))) ||
            (card.sub === "elemCards" && (Array.isArray(existingCard.element) ? existingCard.element.includes(card.element) : existingCard.element === card.element)))
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
              (Array.isArray(card.element)
                ? card.element.includes(existingCard.element)
                : card.element === existingCard.element)))
        );
      } else if (card.type === "act") {
        return (
          existingCard.type === "char" &&
          ((card.sub === "classCards" &&
            existingCard.classes.some((cls) => card.classes.includes(cls))) ||
            (card.sub === "elemCards" &&
              (Array.isArray(existingCard.element)
                ? existingCard.element.includes(card.element)
                : existingCard.element === card.element)))
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

function getElementBonus(attacker, defender) {
    if (!window.batSys || !window.batSys.elementBonuses) return 1;
    let bonuses = window.batSys.elementBonuses;
    if (bonuses[attacker.element]?.strongAgainst === defender.element) return 1.2;
    if (bonuses[attacker.element]?.weakAgainst === defender.element) return 0.8;
    return 1;
}

function getClassBonus(attacker, defender) {
    if (!window.batSys || !window.batSys.classBonuses) return 1;
    let bonuses = window.batSys.classBonuses;
    if (bonuses[attacker.class]?.strongAgainst.includes(defender.class)) return 1.2;
    if (bonuses[attacker.class]?.weakAgainst.includes(defender.class)) return 0.8;
    return 1;
}


function createCardElement(card) {
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
      ? card.element.map((el) => elementEmojis[el] || "").filter(Boolean).join(" ")
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

  const attributesElement = document.createElement("div");
  attributesElement.classList.add("card-attributes");
  if (card.classes?.length > 0) {
    attributesElement.textContent = `${card.classes.join(", ")}`;
  }
  cardDiv.appendChild(attributesElement);

  if (card.hp || card.atk || card.def) {
    const statsElement = document.createElement("div");
    statsElement.classList.add("card-stats");
    statsElement.innerHTML = `❤️: ${card.hp || 0} ⚔️: ${card.atk || 0} 🛡️: ${card.def || 0}`;
    cardDiv.appendChild(statsElement);
  }

  if (card.desc) {
    const descElement = document.createElement("div");
    descElement.classList.add("card-desc");
    descElement.textContent = card.desc;
    cardDiv.appendChild(descElement);
  }
  return cardDiv;
}

async function doAiMove() {
    await new Promise(resolve => setTimeout(resolve, gameConfig.aiSettings.moveDelay));

    if (!p2Hand || p2Hand.length === 0) {
        console.log("AI (Player 2) has no cards left to play.");
        return;
    }
    
    let playableCards = p2Hand.filter((card) => {
        if (!p2BZ || p2BZ.length === 0) {
            return true;
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
    
    const chosenCard = playableCards[Math.floor(Math.random() * playableCards.length)];
    logBattleEvent(`AI played ${chosenCard.name}!`);
    playCard(chosenCard, p2Hand, p2BZ, "p2-battlezone");
    renderHand(p2Hand, "p2-hand", "p2");
}

function resolveCombat(attacker, defender) {
    if (!attacker || !defender) return;

    let baseDamage = Math.max(attacker.atk - defender.def, 0);
	let elementBonus = getElementBonus(attacker, defender);
	let classBonus = getClassBonus(attacker, defender);
	let damage = (attacker.atk - defender.def) * elementBonus * classBonus;

    
    defender.hp = Math.max(defender.hp - damage, 0);
	logBattleEvent(`${attacker.name} attacks ${defender.name} for ${damage} damage!`);

    if (defender.hp === 0) {
        removeDestroyedCard(defender);
        logBattleEvent(`${defender.name} was destroyed!`);
    }
    
    updateBZs();
}
function removeDestroyedCard(card) {
    let index = p1BZ.indexOf(card);
    if (index !== -1) p1BZ.splice(index, 1);
    
    index = p2BZ.indexOf(card);
    if (index !== -1) p2BZ.splice(index, 1);
    
    updateBZs();
}
function updateBZs() {
    renderBZ(p1BZ, "p1-battlezone");
    renderBZ(p2BZ, "p2-battlezone");
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
    return p1BZ?.find((card) => card.name === cardName) || p2BZ?.find((card) => card.name === cardName) || null;
}

// ============= WIN CONDITION CHECKING =============
function checkWinConditions() {
  const p1Lost = !p1BZ.length && !p1Hand.length && !p1Deck.length;
  const p2Lost = !p2BZ.length && !p2Hand.length && !p2Deck.length;

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

function handleDrawPhase() {
  drawCard(p1Hand, p1Deck);
  drawCard(p2Hand, p2Deck);
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
  if (deck.length) hand.push(deck.shift());
  renderHand(hand, hand === p1Hand ? "p1-hand" : "p2-hand", hand === p1Hand ? "p1" : "p2");
}

// ============= AI ATTACK LOGIC =============
async function doAiAttack() {
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
getElementSafe("start-game")?.addEventListener("click", initGame);
getElementSafe("play-turn")?.addEventListener("click", handleTurn);

// ============= GAME END LOGIC =============
function endGame(winner) {
  logBattleEvent(`Game Over! ${winner} wins!`);
  console.log(`Game Over! ${winner} wins!`);
}
