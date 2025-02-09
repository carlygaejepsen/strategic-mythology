import { playerHand, enemyHand } from "./cards.js"; // ✅ Import player and enemy hands
import { battleSystem } from "./config.js"; // ✅ Import battle rules

function battleRound() {
    if (!playerHand.length || !enemyHand.length) {
        console.log("One player has no cards left! Game over.");
        return;
    }

    const playerCard = playerHand[0];
    const enemyCard = enemyHand[0];

    console.log(`${playerCard.name} vs ${enemyCard.name}`);

    function calculateDamage(attacker, defender) {
        let baseDamage = Math.max(attacker.atk - defender.def, battleSystem.damageCalculation.minDamage);

        defender.hp -= Math.floor(baseDamage);
        console.log(`${attacker.name} hits ${defender.name} for ${baseDamage} damage!`);
    }

    calculateDamage(playerCard, enemyCard);
    if (enemyCard.hp > 0) calculateDamage(enemyCard, playerCard);

    if (playerCard.hp <= 0) playerHand.shift();
    if (enemyCard.hp <= 0) enemyHand.shift();
}

export { battleRound };
