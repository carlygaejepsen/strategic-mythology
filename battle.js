import { playerHand, enemyHand } from "./cards.js"; // ✅ Import player and enemy hands
import { battleSystem, gameConfig } from "./config.js"; // ✅ Import battle rules and messages

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
        if (!attacker || !defender) return; // Prevents crashes if a card is missing

        let baseDamage = Math.max(
            attacker.atk - (defender.def ?? 0), // Ensure def is handled properly
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
