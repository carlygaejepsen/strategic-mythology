import { updateHands } from "./card-display.js";
import { handleCardClick } from "./interact.js";
import { 
  gameConfig, 
  currentPlayerBattleCards, 
  currentEnemyBattleCards, 
  shuffleDeck, 
  enemyDeck, 
  playerDeck, 
  playerHand, 
  enemyHand, 
  cardTemplates, 
  gameState, 
  debugMode 
} from "./config.js";
import { logDebug, logError } from "./utils/logger.js";

// ✅ Replace placeholders in a template with provided data
function populateTemplate(template, data) {
  return template.replace(/{(\w+)}/g, (match, key) => (key in data ? data[key] : match));
}

// 🃏 Deals starting hands from decks & updates the UI
export function dealStartingHands() {
  const HAND_SIZE = 6;

  if (playerDeck.length < HAND_SIZE || enemyDeck.length < HAND_SIZE) {
    console.error("❌ Not enough cards to deal starting hands.");
    return;
  }

  playerHand.length = 0; 
  enemyHand.length = 0;

  playerHand.push(...playerDeck.splice(0, HAND_SIZE));
  enemyHand.push(...enemyDeck.splice(0, HAND_SIZE));

  updateHands(); // ✅ Refresh UI after dealing

  console.log("🎴 Player Hand:", playerHand);
  console.log("🎴 Enemy Hand:", enemyHand);
}

// 🏷️ Determines the card type safely, caches result to avoid redundant calls
export function determineCardType(card) {
  if (!card) {
    console.error("🚨 ERROR: `determineCardType()` received an undefined or null card!");
    return "unknown";
  }

  if (!card.cachedType) {
    card.cachedType = card.type || "char";
  }
  return card.cachedType;
}

// 🎨 Creates a card element
export function createCardElement(card) {
  const computedType = card.cachedType || determineCardType(card);
  logDebug(`🎨 Creating card: ${card.name} (Type: ${computedType})`);

  if (!cardTemplates[computedType]) {
    logError(`❌ ERROR: Missing template for card type: ${computedType}`);
    return document.createElement("div");
  }

  // Populate template with card data
  const template = cardTemplates[computedType].html;
  const populatedHTML = populateTemplate(template, {
    name: card.name || "Unknown",
    img: card.img || "",
    hp: card.hp ?? "0", // Ensure hp is always present
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

  // 🏗️ Build Card Structure
  const containerDiv = document.createElement("div");
  containerDiv.classList.add("card-container");
  containerDiv.setAttribute("data-card-id", card.id); // Ensure unique card tracking

  const imageWrapper = document.createElement("div");
  imageWrapper.classList.add("image-wrapper");

  const cardDiv = document.createElement("div");
  cardDiv.classList.add(`${computedType}-card`);
  cardDiv.innerHTML = populatedHTML;

  // Move the image inside `.image-wrapper`
  const imgElement = cardDiv.querySelector("img");
  if (imgElement) {
    imageWrapper.appendChild(imgElement);
  }

  // 🌀 Proper Essence Emoji Handling
  const essences = Array.isArray(card.essences) ? card.essences : (card.essence ? [card.essence] : []);

  essences.forEach((ess, index) => {
    const essenceEmojiDiv = document.createElement("div");
    essenceEmojiDiv.classList.add("essence-emoji");

    // ✅ Positioning Rules
    if (essences.length === 1) {
      essenceEmojiDiv.classList.add("essence-single"); // Bottom-right for single essence
    } else {
      essenceEmojiDiv.classList.add(index === 0 ? "essence-bottom-left" : "essence-bottom-right");
    }

    essenceEmojiDiv.innerHTML = gameConfig?.["essence-emojis"]?.[ess] || "❓";
    imageWrapper.appendChild(essenceEmojiDiv);
  });

  // 🏗️ Final Assembly
  cardDiv.insertBefore(imageWrapper, cardDiv.firstChild);
  containerDiv.appendChild(cardDiv);

  // 🖱️ Click Handling
  containerDiv.addEventListener("click", () => {
    console.log(`🖱️ Clicked on card: ${card.name}`);
    handleCardClick(card);
  });

  return containerDiv;
}
