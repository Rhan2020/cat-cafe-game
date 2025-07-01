const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * Checks if an animal has enough EXP to level up. If so, it processes the level-up,
 * updating the animal's level and remaining EXP. This can handle multiple level-ups in one call.
 *
 * @param {Object} event - The event object.
 * @param {string} event.animalId - The ID of the animal to check.
 * @returns {Promise<Object>} - A result object indicating if a level-up occurred.
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { animalId } = event;

  if (!animalId) {
    return { code: 400, message: 'animalId is required.' };
  }

  try {
    // --- Step 1: Fetch animal data and level-up configurations in parallel ---
    const [animalRes, configRes] = await Promise.all([
      db.collection('animals').where({ _id: animalId, _openid: openid }).get(),
      db.collection('game_configs').doc('animal_level_up_exp').get()
    ]);

    if (!animalRes.data || animalRes.data.length === 0) {
      return { code: 404, message: 'Animal not found or not owned by the user.' };
    }
    if (!configRes.data || !configRes.data.data) {
        return { code: 500, message: 'Game level up configuration not found.' };
    }
    
    let animal = animalRes.data[0];
    const levelUpExps = configRes.data.data; // e.g., [100, 200, 300]

    // --- Step 2: Calculate level-ups in a loop ---
    let originalLevel = animal.level;
    let didLevelUp = false;

    // Check if the animal can level up from its current level
    while (animal.level < levelUpExps.length + 1 && animal.exp >= levelUpExps[animal.level - 1]) {
        didLevelUp = true;
        const requiredExp = levelUpExps[animal.level - 1];
        animal.exp -= requiredExp;
        animal.level++;
    }

    // --- Step 3: If a level-up occurred, update the database ---
    if (didLevelUp) {
      await db.collection('animals').doc(animalId).update({
        data: {
          level: animal.level,
          exp: animal.exp
        }
      });
      logger.info(`Animal ${animalId} leveled up from ${originalLevel} to ${animal.level}.`);
    }

    return {
      code: 200,
      message: didLevelUp ? 'Level up successful.' : 'Not enough EXP to level up.',
      data: {
        didLevelUp,
        newLevel: animal.level,
        currentExp: animal.exp
      }
    };

  } catch (err) {
    logger.error(`Error in check_animal_level_up for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error' };
  }
}; 