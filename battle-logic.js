// battle-logic.js - Handles Combat Logic & Combos

import { logToResults } from "./ui-display.js";
import { updateCardHP, removeDefeatedCards } from "./card-display.js";
import { determineCardType } from "./cards.js";

export const battleSystem = {
  combos: {
    char_alone: 20,
    "essence-card-alone": 10,
    "ability-card-alone": 10,
    "char-plus-essence-card": 40,
    "char-plus-ability-card": 40,
    "full-combo": 60, // Full combo includes char + essence + ability
  },
  damageCalculation: {
    minDamage: 1,
    criticalMultiplier: 1.5,
    essenceBonusMultiplier: 1.2,
    classBonusMultiplier: 1.2,
  },
  essenceBonuses: {
    fire: { strongAgainst: "plant", weakAgainst: "water" },
    water: { strongAgainst: "fire", weakAgainst: "earth" },
    air: { strongAgainst: "earth", weakAgainst: "fire" },
    earth: { strongAgainst: "water", weakAgainst: "air" },
    electricity: { strongAgainst: "water", weakAgainst: "earth" },
    love: { strongAgainst: "malice", weakAgainst: "hubris" },
    malice: { strongAgainst: "wisdom", weakAgainst: "love" },
    hubris: { strongAgainst: "wisdom", weakAgainst: "justice" },
    wisdom: { strongAgainst: "hubris", weakAgainst: "malice" },
    light: { strongAgainst: "dark", weakAgainst: null },
    dark: { strongAgainst: "light", weakAgainst: null },
    vit: { strongAgainst: "death", weakAgainst: null },
    death: { strongAgainst: "vit", weakAgainst: null },
    justice: { strongAgainst: "hubris", weakAgainst: null },
    luck: { strongAgainst: null, weakAgainst: null },
  },
  classBonuses: {
    wars: { strongAgainst: ["oracles", "sages"], weakAgainst: ["ecs", "cares"] },
    heroes: { strongAgainst: ["auth", "mys"], weakAgainst: ["wilds", "oracles"] },
    wilds: { strongAgainst: ["sages", "auth"], weakAgainst: ["wars", "ecs"] },
    mals: { strongAgainst: ["cares", "ecs"], weakAgainst: ["sages", "heroes"] },
    oracles: { strongAgainst: ["auth", "heroes"], weakAgainst: ["wars", "wilds"] },
    ecs: { strongAgainst: ["wilds", "wars"], weakAgainst: ["cares", "sages"] },
    cares: { strongAgainst: ["wars", "heroes"], weakAgainst: ["mals", "auth"] },
    auth: { strongAgainst: ["sages", "wilds"], weakAgainst: ["heroes", "oracles"] },
    sages: { strongAgainst: ["cares", "ecs"], weakAgainst: ["wilds", "wars"] },
    mys: { strongAgainst: ["auth", "sages"], weakAgainst: ["heroes", "oracles"] },
  },
};

// ⚔️ **Process Combat: Handles attack logic**
export function processCombat(attacker, defender, isCombo = false) {
  if (!attacker?.name || !defender?.name) {
    console.error("🚨 ERROR: Invalid combatants! Attack skipped.");
    return;
  }
  if (attacker === defender) {
    console.error(`🚨 ERROR: ${attacker.name} cannot attack itself!`);
    return;
  }
  if (defender.hp <= 0) {
    console.warn(`⚠️ ${defender.name} is already defeated! Attack skipped.`);
    return;
  }

  console.log(`⚔️ ${attacker.name} attacks ${defender.name}`);

  let attackPower = attacker.atk || 0;

  // ✅ **Apply Combo Bonus**
  if (isCombo) {
    attackPower *= 2;
    logToResults(`🔥 Combo boost! ${attacker.name} strikes with extra force!`);
  }

  // ✅ **Apply Essence & Class Multipliers**
  let essenceMultiplier = calculateEssenceMultiplier(attacker.essence, defender.essence);
  let classMultiplier = calculateClassMultiplier(attacker.class, defender.class);

  const baseDamage = Math.max(
    Math.round((attackPower * essenceMultiplier * classMultiplier) - (defender.def || 0)),
    battleSystem.damageCalculation.minDamage
  );

  // ✅ **Apply Damage & Log**
  defender.hp = Math.max(0, defender.hp - baseDamage);
  logToResults(`💥 ${attacker.name} hits ${defender.name} for ${baseDamage} damage!`);

  if (defender.hp > 0) {
    updateCardHP(defender);
  } else {
    logToResults(`☠️ ${defender.name} has been defeated!`);
    removeDefeatedCards();
  }
}

// 🔥 **Calculate Essence Multiplier**
function calculateEssenceMultiplier(attackerEssence, defenderEssence) {
  if (!attackerEssence || !defenderEssence) return 1;
  if (battleSystem.essenceBonuses[attackerEssence]?.strongAgainst === defenderEssence) {
    return battleSystem.damageCalculation.essenceBonusMultiplier;
  }
  if (battleSystem.essenceBonuses[attackerEssence]?.weakAgainst === defenderEssence) {
    return 1 / battleSystem.damageCalculation.essenceBonusMultiplier;
  }
  return 1;
}

// 💥 **Calculate Class Multiplier**
function calculateClassMultiplier(attackerClass, defenderClass) {
  if (!attackerClass || !defenderClass) return 1;
  if (battleSystem.classBonuses[attackerClass]?.strongAgainst?.includes(defenderClass)) {
    return battleSystem.damageCalculation.classBonusMultiplier;
  }
  if (battleSystem.classBonuses[attackerClass]?.weakAgainst?.includes(defenderClass)) {
    return 1 / battleSystem.damageCalculation.classBonusMultiplier;
  }
  return 1;
}

// ✅ **Check if a Combo is Activated**
export function checkForCombos(battleZone, owner) {
  const cards = Object.values(battleZone).filter(card => card !== null);
  let comboFound = false;
  const classMap = {};
  const essenceMap = {};

  cards.forEach(card => {
    if (card.classes) {
      card.classes.forEach(cls => {
        if (classMap[cls]) {
          logToResults(`🔥 ${owner} activated class combo: ${classMap[cls].name} + ${card.name}`);
          comboFound = true;
        } else {
          classMap[cls] = card;
        }
      });
    }
    if (card.essence) {
      if (essenceMap[card.essence]) {
        logToResults(`🔥 ${owner} activated essence combo: ${essenceMap[card.essence].name} + ${card.name}`);
        comboFound = true;
      } else {
        essenceMap[card.essence] = card;
      }
    }
  });

  return comboFound;
}

// ⚡ **Check for a Triple Combo**
export function checkForTripleCombo(battleZone, owner) {
  const types = ["char", "essence", "ability"];
  const hasAllTypes = types.every(type => battleZone[type]);
  if (hasAllTypes) {
    logToResults(`⚡ ${owner} activated TRIPLE COMBO!`);
  }
  return hasAllTypes;
}

// 💥 **Execute Triple Combo Attack**
export function performTripleCombo(owner, opponentBattleZone) {
  const damage = 60;
  Object.values(opponentBattleZone).forEach(card => {
    if (card) {
      card.hp = Math.max(0, card.hp - damage);
      logToResults(`💥 ${owner}'s triple combo hits ${card.name} for ${damage}!`);
      updateCardHP(card);
    }
  });
}
