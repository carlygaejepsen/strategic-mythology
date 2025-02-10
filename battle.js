import { playerHand, enemyHand } from "./cards.js";
import { battleSystem, gameConfig } from "./config.js";

function battleRound() {
    if (!playerHand.length || !enemyHand.length) {
        console.log("❌ One player has no cards left! Game over.");
        return;
    }

    const playerCard = playerHand[0];
    const enemyCard = enemyHand[0];

    console.log(gameConfig["battle-messages"].battleStart
        .replace("{player}", playerCard.name)
        .replace("{enemy}", enemyCard.name)
    );

    function calculateDamage(attacker, defender) {
        if (!attacker || !defender) return;

        let essenceMultiplier = battleSystem.essenceBonuses[attacker.essence]?.strongAgainst === defender.essence ? battleSystem.damageCalculation.essenceBonusMultiplier :
                                battleSystem.essenceBonuses[attacker.essence]?.weakAgainst === defender.essence ? 1 / battleSystem.damageCalculation.essenceBonusMultiplier : 1;

        let classMultiplier = battleSystem.classBonuses[attacker.class]?.strongAgainst.includes(defender.class) ? battleSystem.damageCalculation.classBonusMultiplier :
                              battleSystem.classBonuses[attacker.class]?.weakAgainst.includes(defender.class) ? 1 / battleSystem.damageCalculation.classBonusMultiplier : 1;

        let baseDamage = Math.max(
            (attacker.atk * essenceMultiplier * classMultiplier) - (defender.def ?? 0),
            battleSystem.damageCalculation.minDamage
        );

        defender.hp -= Math.floor(baseDamage);

        console.log(gameConfig["battle-messages"].attackMessage
            .replace("{attacker}", attacker.name)
            .replace("{defender}", defender.name)
            .replace("{damage}", baseDamage)
        );
    }

    calculateDamage(playerCard, enemyCard);
    if (enemyCard.hp > 0) calculateDamage(enemyCard, playerCard);

    if (playerCard.hp <= 0) {
        console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", playerCard.name));
        playerHand.shift();
    }

    if (enemyCard.hp <= 0) {
        console.log(gameConfig["battle-messages"].defeatMessage.replace("{card}", enemyCard.name));
        enemyHand.shift();
    }
}

export { battleRound };
