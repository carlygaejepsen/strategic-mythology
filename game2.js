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
        cardTemplates = await loadJSON("./data/card-templates.json");
        gameConfig = await loadJSON("./data/game-config.json");
    } catch (error) {
        console.error("Error loading configuration files:", error);
    }
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
    if (!cardTemplates[type]) {
        console.error(`Missing template for card type: ${type}`);
        return document.createElement("div");
    }

    let cardHTML = cardTemplates[type].html;

    cardHTML = cardHTML
        .replace("{name}", card.name)
        .replace("{img}", card.img)
        .replace("{hp}", card.hp || "")
        .replace("{atk}", card.atk || "")
        .replace("{def}", card.def || "")
        .replace("{spd}", card.spd || "")
        .replace("{essence}", card.essence || "")
        .replace("{essence_emoji}", gameConfig.essenceEmojis[card.essence] || card.essence || "")
        .replace("{classes}", card.classes ? card.classes.map(cls => `<span class="class-tag">${gameConfig.classNames[cls] || cls}</span>`).join("") : "")
        .replace("{essences}", card.essences ? card.essences.map(ess => `<span class="essence ${ess}">${gameConfig.essenceEmojis[ess] || ess}</span>`).join("") : "");

    const cardDiv = document.createElement("div");
    cardDiv.classList.add(`${type}-card`);
    cardDiv.innerHTML = cardHTML;
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
        gameConfig.battleMessages.battleStart
            .replace("{player}", playerCard.name)
            .replace("{enemy}", enemyCard.name)
    );

    // Determine attack order from JSON
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
        if (battleSystem.classBonuses[attacker.classes]?.strongAgainst?.includes(defender.classes)) {
            baseDamage *= damageCalc.classBonusMultiplier;
        }

        baseDamage = Math.floor(baseDamage);
        defender.hp -= baseDamage;

        console.log(
            gameConfig.battleMessages.attackMessage
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
        console.log(gameConfig.battleMessages.defeatMessage.replace("{card}", playerCard.name));
        playerHand.shift();
        playerBattleZone.innerHTML = "";
    }
    if (enemyCard.hp <= 0) {
        console.log(gameConfig.battleMessages.defeatMessage.replace("{card}", enemyCard.name));
        enemyHand.shift();
        enemyBattleZone.innerHTML = "";
    }
}
//
async function startGame() {
    await loadAllCards();
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
