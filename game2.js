let cardTemplates = {}; 
let gameConfig = {};  
let battleSystem = {};
let playerDeck = [];
let enemyDeck = [];
let playerHand = [];
let enemyHand = [];

//
async function loadJSON(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching JSON:", error);
        return [];
    }
}
//
async function loadConfigFiles() {
    try {
        console.log("Fetching configuration files...");

        const [cardTemplatesResponse, gameConfigResponse] = await Promise.all([
            fetch("./card-templates.json"),
            fetch("./data/game-config.json")
        ]);

        if (!cardTemplatesResponse.ok) throw new Error(`Failed to fetch card-templates.json: ${cardTemplatesResponse.status}`);
        if (!gameConfigResponse.ok) throw new Error(`Failed to fetch game-config.json: ${gameConfigResponse.status}`);

        cardTemplates = await cardTemplatesResponse.json();
        gameConfig = await gameConfigResponse.json();  // ✅ Now gameConfig is actually loaded

        console.log("✅ Loaded card templates:", cardTemplates);
        console.log("✅ Loaded gameConfig:", gameConfig);
        console.log("✅ Essence Emojis:", gameConfig["essence-emojis"]);
        console.log("✅ Class Names:", gameConfig["class-names"]);

        if (!gameConfig || Object.keys(gameConfig).length === 0) {
            console.error("❌ ERROR: gameConfig is STILL EMPTY after loading!");
        }
    } catch (error) {
        console.error("❌ ERROR loading configuration files:", error);
    }
}

//
function populateTemplate(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => data[key] || '');
}
//
async function loadAllCards() {
    try {
        const characterFiles = [
            "./data/beast-chars.json", "./data/bully-chars.json", "./data/celestial-chars.json",
            "./data/hero-chars.json", "./data/life-chars.json", "./data/mystical-chars.json",
            "./data/olympian-chars.json", "./data/plant-chars.json", "./data/underworld-chars.json",
            "./data/water-chars.json"
        ];

        let characterDeck = (await Promise.all(characterFiles.map(loadJSON))).flat();
        let essenceDeck = await loadJSON("./data/essence-cards.json");
        let abilityDeck = await loadJSON("./data/ability-cards.json");
		battleSystem = await loadJSON("./data/bat-sys.json");
 
        let fullDeck = [...characterDeck, ...essenceDeck, ...abilityDeck];

        playerDeck = shuffleDeck([...fullDeck]);
        enemyDeck = shuffleDeck([...fullDeck]);

        console.log("Player Deck:", playerDeck);
        console.log("Enemy Deck:", enemyDeck);
    } catch (error) {
        console.error("Error loading cards:", error);
    }
}
//
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}
//
function createCardElement(card, type) {
    console.log(`Creating card with type: ${type}`, "Card:", card);
    console.log("Available templates:", Object.keys(cardTemplates));

    if (!cardTemplates[type]) {
        console.error(`❌ ERROR: Missing template for card type: ${type}`);
        console.error(`Valid types are:`, Object.keys(cardTemplates));
        return document.createElement("div"); 
    }

    if (!gameConfig || Object.keys(gameConfig).length === 0) {
        console.error("❌ ERROR: gameConfig is empty or not loaded!");
        return document.createElement("div");
    }

    // Retrieve the template for the card type
    const template = cardTemplates[type].html;

    // Safely populate the template with card data
    const populatedHTML = populateTemplate(template, {
        name: card.name || "Unknown",
        img: card.img || "",
        hp: card.hp ?? "N/A",
        atk: card.atk ?? "N/A",
        def: card.def ?? "N/A",
        spd: card.spd ?? "N/A",
        essence: card.essence || "None",
        essence_emoji: gameConfig["essence-emojis"]?.[card.essence] || "❓",
        classes: Array.isArray(card.classes) 
            ? card.classes.map(cls => `<span class="class-tag">${gameConfig["class-names"]?.[cls] || cls}</span>`).join(", ") 
            : "None",
        essences: Array.isArray(card.essences) 
            ? card.essences.map(ess => `<span class="essence ${ess}">${gameConfig["essence-emojis"]?.[ess] || ess}</span>`).join(" ") 
            : "None"
    });

    // Create the card element and apply populated content
    const cardDiv = document.createElement("div");
    cardDiv.classList.add(`${type}-card`);
    cardDiv.innerHTML = populatedHTML;

    return cardDiv;
}

//
function dealStartingHands() {
    playerHand = [];
    enemyHand = [];

    const playerContainer = document.getElementById("player-hand");
    const enemyContainer = document.getElementById("enemy-hand");

    playerContainer.innerHTML = "";
    enemyContainer.innerHTML = "";

    for (let i = 0; i < 5; i++) {
        if (playerDeck.length > 0) playerHand.push(playerDeck.pop());
        if (enemyDeck.length > 0) enemyHand.push(enemyDeck.pop());
    }

    playerHand.forEach(card => {
        playerContainer.appendChild(createCardElement(card, card.type));
    });

    enemyHand.forEach(card => {
        enemyContainer.appendChild(createCardElement(card, card.type));
    });
}
//
async function battleRound() {
    if (playerHand.length === 0 || enemyHand.length === 0) {
        console.log("One player has no cards left! Game over.");
        return;
    }

    const playerCard = playerHand[0];
    const enemyCard = enemyHand[0];

    const playerBattleZone = document.getElementById("player-battle-zone");
    const enemyBattleZone = document.getElementById("enemy-battle-zone");

    playerBattleZone.innerHTML = "";
    playerBattleZone.appendChild(createCardElement(playerCard, "char"));

    enemyBattleZone.innerHTML = "";
    enemyBattleZone.appendChild(createCardElement(enemyCard, "char"));

    console.log(
        gameConfig["battle-messages"].battleStart
            .replace("{player}", playerCard.name)
            .replace("{enemy}", enemyCard.name)
    );

    let firstAttacker, secondAttacker;
    if (battleSystem.battleMechanics.attackRules.attackOrder === "Highest speed attacks first. If tied, attacker goes first.") {
        if (playerCard.spd > enemyCard.spd) {
            firstAttacker = playerCard;
            secondAttacker = enemyCard;
        } else if (enemyCard.spd > playerCard.spd) {
            firstAttacker = enemyCard;
            secondAttacker = playerCard;
        } else {
            firstAttacker = "player";
            secondAttacker = "enemy";
        }
    }

    function calculateDamage(attacker, defender) {
        let damageCalc = battleSystem.battleMechanics.damageCalculation;
        let baseDamage = Math.max(attacker.atk - defender.def, damageCalc.minDamage);

        if (battleSystem.elementBonuses[attacker.essence]?.strongAgainst === defender.essence) {
            baseDamage *= damageCalc.essenceBonusMultiplier;
        }
        if (Array.isArray(attacker.classes) && Array.isArray(defender.classes)) {
            for (let cls of attacker.classes) {
                if (battleSystem.classBonuses[cls]?.strongAgainst?.some(defCls => defender.classes.includes(defCls))) {
                    baseDamage *= damageCalc.classBonusMultiplier;
                    break;
                }
            }
        }

        baseDamage = Math.floor(baseDamage);
        defender.hp -= baseDamage;

        console.log(
            gameConfig["battle-messages"].attackMessage
                .replace("{attacker}", attacker.name)
                .replace("{defender}", defender.name)
                .replace("{damage}", baseDamage)
        );
    }
    
    if (firstAttacker === "player") {
        calculateDamage(playerCard, enemyCard);
        if (enemyCard.hp > 0) calculateDamage(enemyCard, playerCard);
    } else {
        calculateDamage(enemyCard, playerCard);
        if (playerCard.hp > 0) calculateDamage(playerCard, enemyCard);
    }
    
    if (playerCard.hp <= 0) {
        console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", playerCard.name));
        playerHand.shift();
        playerBattleZone.innerHTML = "";
    }
    if (enemyCard.hp <= 0) {
        console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", enemyCard.name));
        enemyHand.shift();
        enemyBattleZone.innerHTML = "";
    }
}

//
async function startGame() {
    await loadConfigFiles();
	await loadAllCards();
	    if (!gameConfig || Object.keys(gameConfig).length === 0) {
        console.error("❌ ERROR: gameConfig is still empty after loading!");
        return;
    }
    dealStartingHands();
}

document.addEventListener("DOMContentLoaded", startGame);

const playTurnButton = document.getElementById("play-turn");

if (playTurnButton) {
    playTurnButton.addEventListener("click", () => {
        battleRound();
    });
} else {
    console.error("Error: 'play-turn' button not found!");
}
