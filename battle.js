import { currentPlayerBattleCard, currentEnemyBattleCard } from "./cards.js";
import { battleSystem, gameConfig } from "./config.js";

function battleRound() {
    if (!currentPlayerBattleCard || !currentEnemyBattleCard) {
        console.log("❌ No active cards in the battle zone! Game over.");
        return;
    }

    console.log(gameConfig["battle-messages"].battleStart
        .replace("{player}", currentPlayerBattleCard.name)
        .replace("{enemy}", currentEnemyBattleCard.name)
    );

    function calculateDamage(attacker, defender) {
        if (!attacker || !defender) return;

        let essenceMultiplier = battleSystem.essenceBonuses[attacker.essence]?.strongAgainst === defender.essence 
            ? battleSystem.damageCalculation.essenceBonusMultiplier
            : battleSystem.essenceBonuses[attacker.essence]?.weakAgainst === defender.essence
            ? 1 / battleSystem.damageCalculation.essenceBonusMultiplier
            : 1;

        let classMultiplier = battleSystem.classBonuses[attacker.class]?.strongAgainst.includes(defender.class) 
            ? battleSystem.damageCalculation.classBonusMultiplier
            : battleSystem.classBonuses[attacker.class]?.weakAgainst.includes(defender.class)
            ? 1 / battleSystem.damageCalculation.classBonusMultiplier
            : 1;

        let baseDamage = Math.max(
            (attacker.atk * essenceMultiplier * classMultiplier) - (defender.def ?? 0),
            battleSystem.damageCalculation.minDamage
        );

        baseDamage = Math.round(baseDamage); // ✅ Round damage values
        defender.hp -= baseDamage;

        console.log(gameConfig["battle-messages"].attackMessage
            .replace("{attacker}", attacker.name)
            .replace("{defender}", defender.name)
            .replace("{damage}", baseDamage)
        );
    }

    calculateDamage(currentPlayerBattleCard, currentEnemyBattleCard);
    if (currentEnemyBattleCard.hp > 0) calculateDamage(currentEnemyBattleCard, currentPlayerBattleCard);

    if (currentPlayerBattleCard.hp <= 0) {
        console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentPlayerBattleCard.name));
        currentPlayerBattleCard = null; // ✅ Remove defeated player card from battle
    }

    if (currentEnemyBattleCard.hp <= 0) {
        console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", currentEnemyBattleCard.name));
        currentEnemyBattleCard = null; // ✅ Remove defeated enemy card from battle
    }
}

export { battleRound };
