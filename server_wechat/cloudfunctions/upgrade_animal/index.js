const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 动物升级系统 - 为动物增加经验值并处理等级提升
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { animalId, expToAdd, useItems } = event;

  if (!openid) {
    return { code: 401, message: 'Unauthorized. User OPENID not found.' };
  }

  if (!animalId || (!expToAdd && !useItems)) {
    return { code: 400, message: 'animalId and either expToAdd or useItems are required.' };
  }

  try {
    // 获取动物当前数据
    const animalResult = await db.collection('animals').doc(animalId).get();
    
    if (!animalResult.data || animalResult.data.ownerId !== openid) {
      return { code: 404, message: 'Animal not found or not owned by user.' };
    }

    const animal = animalResult.data;
    
    // 获取升级经验配置
    const configResult = await db.collection('game_configs').doc('level_up_exp').get();
    
    if (!configResult.data || !configResult.data.data) {
      return { code: 500, message: 'Level up experience configuration not found.' };
    }

    const levelUpExps = configResult.data.data;
    
    let totalExpToAdd = expToAdd || 0;
    let itemsUsed = [];

    // 处理使用道具增加经验
    if (useItems && useItems.length > 0) {
      const itemsConfig = await db.collection('game_configs').doc('items').get();
      const items = itemsConfig.data?.data || [];
      const itemMap = new Map(items.map(item => [item.itemId, item]));

      const userResult = await db.collection('users').doc(openid).get();
      const inventory = userResult.data?.inventory || {};

      for (const useItem of useItems) {
        const { itemId, count } = useItem;
        const itemConfig = itemMap.get(itemId);

        if (!itemConfig || itemConfig.effect?.action !== 'add_exp') {
          return { code: 400, message: `Invalid item: ${itemId}` };
        }

        if (!inventory[itemId] || inventory[itemId] < count) {
          return { code: 400, message: `Not enough ${itemId} in inventory.` };
        }

        totalExpToAdd += itemConfig.effect.value * count;
        itemsUsed.push({ itemId, count, expValue: itemConfig.effect.value });
      }
    }

    // 计算新等级和经验
    const upgadeResult = calculateLevelUp(animal.level, animal.exp, totalExpToAdd, levelUpExps);

    // 使用事务更新数据
    await db.runTransaction(async transaction => {
      // 更新动物数据
      await transaction.collection('animals').doc(animalId).update({
        data: {
          level: upgadeResult.newLevel,
          exp: upgadeResult.newExp,
          attributes: upgadeResult.newAttributes
        }
      });

      // 扣除使用的道具
      if (itemsUsed.length > 0) {
        const updateData = {};
        for (const usedItem of itemsUsed) {
          updateData[`inventory.${usedItem.itemId}`] = _.inc(-usedItem.count);
        }
        
        await transaction.collection('users').doc(openid).update({
          data: updateData
        });
      }

      // 记录交易日志（如果使用了道具）
      if (itemsUsed.length > 0) {
        await transaction.collection('user_transactions').add({
          data: {
            userId: openid,
            type: 'spend',
            currency: 'items',
            amount: itemsUsed.length,
            reason: 'animal_upgrade',
            relatedId: animalId,
            details: { itemsUsed },
            timestamp: new Date()
          }
        });
      }
    });

    logger.info(`Animal ${animalId} upgraded from level ${animal.level} to ${upgadeResult.newLevel}`);

    return {
      code: 200,
      message: 'Animal upgraded successfully',
      data: {
        animalId,
        levelsBefore: animal.level,
        levelsAfter: upgadeResult.newLevel,
        expAdded: totalExpToAdd,
        itemsUsed,
        newAttributes: upgadeResult.newAttributes,
        skillSlotsUnlocked: upgadeResult.skillSlotsUnlocked
      }
    };

  } catch (err) {
    logger.error(`Error in upgrade_animal for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error', error: err.message };
  }
};

/**
 * 计算等级提升和属性增长
 */
function calculateLevelUp(currentLevel, currentExp, expToAdd, levelUpExps) {
  let newLevel = currentLevel;
  let newExp = currentExp + expToAdd;
  let skillSlotsUnlocked = [];

  // 计算能升到的等级
  while (newLevel < levelUpExps.length && newExp >= levelUpExps[newLevel - 1]) {
    newExp -= levelUpExps[newLevel - 1];
    newLevel++;
    
    // 每5级解锁一个技能槽
    if (newLevel % 5 === 0) {
      skillSlotsUnlocked.push(newLevel);
    }
  }

  // 计算新属性（每级增长）
  const levelGrowth = newLevel - currentLevel;
  const newAttributes = {
    speed: 5 + Math.floor(newLevel * 0.5),
    luck: 1 + Math.floor(newLevel * 0.3),
    cooking: 3 + Math.floor(newLevel * 0.7),
    charm: 2 + Math.floor(newLevel * 0.4),
    stamina: 10 + Math.floor(newLevel * 1.2)
  };

  return {
    newLevel,
    newExp,
    newAttributes,
    skillSlotsUnlocked,
    levelsGained: levelGrowth
  };
}