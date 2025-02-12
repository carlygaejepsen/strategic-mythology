import { updateHands } from "./display.js";
import { handleCardClick } from "./interact.js";
import { gameConfig, currentPlayerBattleCards, currentEnemyBattleCards, shuffleDeck, enemyDeck, playerDeck, playerHand, enemyHand, cardTemplates, gameState } from "./config.js";

// Replaces placeholders in a template with provided data
function populateTemplate(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => (key in data ? data[key] : match));
}

// Deals starting hands from the decks and updates the UI
function dealStartingHands() {
    const HAND_SIZE = 6;
    if (playerDeck.length < HAND_SIZE || enemyDeck.length < HAND_SIZE) {
        console.error("❌ Not enough cards to deal starting hands.");
        return;
    }

    // ✅ Move cards from deck to hand
    playerHand.length = 0; // Clear previous hands
    enemyHand.length = 0;

    playerHand.push(...playerDeck.splice(0, HAND_SIZE));
    enemyHand.push(...enemyDeck.splice(0, HAND_SIZE));

    updateHands(); // ✅ Refresh UI after dealing

    console.log("🎴 Player Hand:", playerHand);
    console.log("🎴 Enemy Hand:", enemyHand);
}

// Determine card type safely
export function determineCardType(card) {
    if (!card) {
        console.error("🚨 ERROR: `determineCardType()` received an undefined or null card!");
        return "unknown"; // Return an explicit error type
    }

    console.log(`DEBUG: Determining type for ${card.name} (Raw Data)`, card);

    if (card.type) {
        console.log(`✅ Identified type for ${card.name}: ${card.type}`);
        return card.type;
    }

    console.warn(`⚠️ No type found for ${card.name}, defaulting to 'char'.`);
    return "char"; // Fallback
}

// ✅ Creates a fully structured card element with proper essence emoji positioning
function createCardElement(card, type) {
    console.log(`🎨 Creating card: ${card.name} (Type: ${type})`);
    const computedType = determineCardType(card);

    if (!cardTemplates[computedType]) {
        console.error(`❌ ERROR: Missing template for card type: ${computedType}`);
        return document.createElement("div");
    }

    // Populate the HTML template
    const template = cardTemplates[computedType].html;
    const populatedHTML = populateTemplate(template, {
        name: card.name || "Unknown",
        img: card.img || "",
        hp: card.hp ?? "",
        atk: card.atk ?? "",
        def: card.def ?? "",
        spd: card.spd ?? "",
        essence: card.essence || "",
        essence_emoji: card.essence ? (gameConfig?.["essence-emojis"]?.[card.essence] || "❓") : "",
        classes: Array.isArray(card.classes)
            ? card.classes.map(cls => `<span class="class-tag">${gameConfig?.["class-names"]?.[cls] || cls}</span>`).join(", ")
            : "",
        essences: Array.isArray(card.essences)
            ? card.essences.map(ess => `<span class="essence ${ess}">${gameConfig?.["essence-emojis"]?.[ess] || ess}</span>`).join(" ")
            : ""
    });

    // 1️⃣ Create the outer card container
    const containerDiv = document.createElement("div");
    containerDiv.classList.add("card-container");

    // 2️⃣ Create an inner wrapper JUST for the image & essence emojis
    const imageWrapper = document.createElement("div");
    imageWrapper.classList.add("image-wrapper");

    // 3️⃣ Create the main card element
    const cardDiv = document.createElement("div");
    cardDiv.classList.add(`${computedType}-card`);
    cardDiv.innerHTML = populatedHTML;

    // 4️⃣ Select the image element and move it into the image wrapper
    const imgElement = cardDiv.querySelector("img");
    if (imgElement) {
        imageWrapper.appendChild(imgElement);
    }

    // 5️⃣ Properly append essence emojis inside `.image-wrapper`
    const essences = Array.isArray(card.essences) ? card.essences : (card.essence ? [card.essence] : []);

    essences.forEach((ess, index) => {
        const essenceEmojiDiv = document.createElement("div");
        essenceEmojiDiv.classList.add("essence-emoji");

        // ✅ Correct positioning
        if (essences.length === 1) {
            essenceEmojiDiv.classList.add("essence-single"); // ✅ Single emoji goes bottom-right
        } else {
            essenceEmojiDiv.classList.add("essence-double");
            essenceEmojiDiv.classList.add(index === 0 ? "essence-top-left" : "essence-bottom-right"); // ✅ Two positions
        }

        essenceEmojiDiv.innerHTML = gameConfig?.["essence-emojis"]?.[ess] || "❓";
        imageWrapper.appendChild(essenceEmojiDiv);
    });

    // 6️⃣ Append the image wrapper into the main card div
    cardDiv.insertBefore(imageWrapper, cardDiv.firstChild);

    // 7️⃣ Insert the main card into the container
    containerDiv.appendChild(cardDiv);

    // 8️⃣ Add click handling on the container
    containerDiv.addEventListener("click", () => {
        console.log(`🖱️ Clicked on card: ${card.name}`);
        handleCardClick(card);
    });

    return containerDiv;
}

export {
    dealStartingHands,
    createCardElement
};
