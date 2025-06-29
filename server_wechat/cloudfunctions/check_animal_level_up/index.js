const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

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
    const configsPromise = db.collection('game_configs').where({ _id: 'level_up_exp' }).get();
    const animalPromise = db.collection('animals').where({ _id: animalId, ownerId: openid }).get();
    
    const [configsResult, animalResult] = await Promise.all([configsPromise, animalPromise]);

    if (animalResult.data.length === 0) {
      return { code: 403, message: 'Animal not found or you do not own it.' };
    }

    const levelUpExps = configsResult.data[0]?.data;
    if (!levelUpExps || levelUpExps.length === 0) {
      return { code: 500, message: 'Level up configuration not found.' };
    }

    let animal = animalResult.data[0];
    let currentLevel = animal.level;
    let currentExp = animal.exp;
    const initialLevel = animal.level;

    // Loop to handle multiple level-ups
    while (true) {
      if (currentLevel - 1 >= levelUpExps.length) {
        // Animal is at max level according to the config
        break;
      }
      
      const expNeeded = levelUpExps[currentLevel - 1];
      
      if (currentExp >= expNeeded) {
        currentLevel++;
        currentExp -= expNeeded;
      } else {
        // Not enough EXP for the next level
        break;
      }
    }

    if (currentLevel > initialLevel) {
      // If a level-up occurred, update the database
      await db.collection('animals').doc(animalId).update({
        data: {
          level: currentLevel,
          exp: currentExp,
          // TODO: Update animal's baseAttributes based on level-up rules
        }
      });
      return { code: 200, data: { didLevelUp: true, newLevel: currentLevel, newExp: currentExp } };
    } else {
      // No level-up occurred
      return { code: 200, data: { didLevelUp: false } };
    }

  } catch (err) {
    console.error(`Error in check_animal_level_up for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error' };
  }
}; 