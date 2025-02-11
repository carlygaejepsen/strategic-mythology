import { logToResults } from "./display.js";
import { determineCardType } from "./cards.js";

// Modified processCombat with combo support
export function processCombat(attacker, defender, isCombo = false) {
  if (!attacker?.name || !defender?.name) return;
  if (attacker === defender) {
    console.error(`🚨 ERROR: ${attacker.name} is trying to attack itself! Skipping attack.`);
    return;
  }

  let attackPower = attacker.atk || 0;
  if (isCombo && ['essence', 'ability'].includes(determineCardType(attacker))) {
    attackPower *= 2;
    logToResults(`🔥 Combo boost for ${attacker.name}!`);
  }

  // Damage multipliers
  let essenceMultiplier = 1;
  let classMultiplier = 1;

  if (attacker.essence && defender.essence) {
    const attackerEss = attacker.essence;
    const defenderEss = defender.essence;
    if (battleSystem.essenceBonuses?.[attackerEss]?.strongAgainst === defenderEss) {
      essenceMultiplier = battleSystem.damageCalculation.essenceBonusMultiplier;
    } else if (battleSystem.essenceBonuses?.[attackerEss]?.weakAgainst === defenderEss) {
      essenceMultiplier = 1 / battleSystem.damageCalculation.essenceBonusMultiplier;
    }
  }

  if (attacker.class && defender.class) {
    const attackerClass = attacker.class;
    const defenderClass = defender.class;
    if (battleSystem.classBonuses?.[attackerClass]?.strongAgainst?.includes(defenderClass)) {
      classMultiplier = battleSystem.damageCalculation.classBonusMultiplier;
    } else if (battleSystem.classBonuses?.[attackerClass]?.weakAgainst?.includes(defenderClass)) {
      classMultiplier = 1 / battleSystem.damageCalculation.classBonusMultiplier;
    }
  }

  const baseDamage = Math.max(
    Math.round((attackPower * essenceMultiplier * classMultiplier) - (defender.def || 0)),
    battleSystem.damageCalculation.minDamage
  );

  defender.hp -= baseDamage;
  logToResults(`${attacker.name} hits ${defender.name} for ${baseDamage} damage!`);
}

export function checkForCombos(battleZone, owner) {
  const cards = Object.values(battleZone).filter(card => card !== null);
  let comboFound = false;

  // Check class combos
  const classMap = {};
  cards.forEach(card => {
    if (card.classes) {
      card.classes.forEach(cls => {
        if (classMap[cls]) {
          logToResults(`🔥 ${owner} class combo: ${classMap[cls].name} + ${card.name}`);
          comboFound = true;
        } else {
          classMap[cls] = card;
        }
      });
    }
  });

  // Check essence combos
  const essenceMap = {};
  cards.forEach(card => {
    if (card.essence) {
      if (essenceMap[card.essence]) {
        logToResults(`🔥 ${owner} essence combo: ${essenceMap[card.essence].name} + ${card.name}`);
        comboFound = true;
      } else {
        essenceMap[card.essence] = card;
      }
    }
  });

  return comboFound;
}

export function checkForTripleCombo(battleZone, owner) {
  const types = ['char', 'essence', 'ability'];
  const hasAllTypes = types.every(type => battleZone[type]);
  if (hasAllTypes) logToResults(`⚡ ${owner} activated TRIPLE COMBO!`);
  return hasAllTypes;
}

export function performTripleCombo(owner, opponentBattleZone) {
  const damage = 60;
  Object.values(opponentBattleZone).forEach(card => {
    if (card) {
      card.hp -= damage;
      logToResults(`💥 ${owner}'s triple combo hits ${card.name} for ${damage}!`);
    }
  });
}



