const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 动物招募 - 抽卡系统
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { boxType, count, currency } = event;

  if (!openid) {
    return { code: 401, message: 'Unauthorized. User OPENID not found.' };
  }

  if (!boxType || !count || !currency) {
    return { code: 400, message: 'boxType, count, and currency are required.' };
  }

  if (!['single', 'ten_pull'].includes(boxType)) {
    return { code: 400, message: 'Invalid boxType. Must be single or ten_pull.' };
  }

  if (!['gold', 'gems'].includes(currency)) {
    return { code: 400, message: 'Invalid currency. Must be gold or gems.' };
  }

  try {
    // 获取抽卡配置
    const recruitConfig = getRecruitConfiguration(boxType, currency);
    
    // 验证用户货币
    const userResult = await db.collection('users').doc(openid).get();
    
    if (!userResult.data) {
      return { code: 404, message: 'User not found.' };
    }

    const user = userResult.data;
    const totalCost = recruitConfig.cost * count;
    
    if (!user[currency] || user[currency] < totalCost) {
      return { code: 400, message: `Not enough ${currency} for recruitment.` };
    }

    // 获取动物品种配置
    const breedsConfigResult = await db.collection('game_configs').doc('animal_breeds').get();
    
    if (!breedsConfigResult.data || !breedsConfigResult.data.data) {
      return { code: 500, message: 'Animal breeds configuration not found.' };
    }

    const animalBreeds = breedsConfigResult.data.data;
    
    // 执行抽卡
    const recruitResults = [];
    const actualCount = boxType === 'ten_pull' ? 10 : count;
    
    for (let i = 0; i < actualCount; i++) {
      const recruitedAnimal = performRecruitment(animalBreeds, recruitConfig, i === 9 && boxType === 'ten_pull');
      recruitResults.push(recruitedAnimal);
    }

    // 检查保底机制
    if (boxType === 'ten_pull') {
      const hasRareOrAbove = recruitResults.some(animal => 
        ['SR', 'SSR', 'USR'].includes(animal.rarity)
      );
      
      if (!hasRareOrAbove) {
        // 替换最后一个为保底SR
        const guaranteedAnimal = getGuaranteedAnimal(animalBreeds, 'SR');
        recruitResults[recruitResults.length - 1] = guaranteedAnimal;
      }
    }

    // 使用事务更新数据
    const createdAnimals = [];
    await db.runTransaction(async transaction => {
      // 扣除货币
      await transaction.collection('users').doc(openid).update({
        data: {
          [currency]: _.inc(-totalCost)
        }
      });

      // 创建招募的动物
      for (const recruitResult of recruitResults) {
        const newAnimal = {
          ownerId: openid,
          species: recruitResult.species,
          breedId: recruitResult.breedId,
          name: generateAnimalName(recruitResult),
          level: 1,
          exp: 0,
          status: 'idle',
          assignedPost: '',
          skills: [],
          attributes: {
            ...recruitResult.baseAttributes
          },
          fatigue: 0,
          mood: 100,
          outfit: '',
          contractInfo: null,
          createdAt: new Date(),
          recruitedFrom: boxType
        };

        const addResult = await transaction.collection('animals').add({
          data: newAnimal
        });

        createdAnimals.push({
          id: addResult._id,
          ...newAnimal,
          rarity: recruitResult.rarity
        });
      }

      // 记录交易日志
      await transaction.collection('user_transactions').add({
        data: {
          userId: openid,
          type: 'spend',
          currency: currency,
          amount: totalCost,
          reason: 'animal_recruitment',
          relatedId: `recruitment_${boxType}_${actualCount}`,
          details: { 
            boxType, 
            count: actualCount,
            recruitedAnimals: recruitResults.map(r => ({ breedId: r.breedId, rarity: r.rarity }))
          },
          timestamp: new Date()
        }
      });

      // 更新用户统计
      await transaction.collection('users').doc(openid).update({
        data: {
          'statistics.totalRecruitments': _.inc(actualCount),
          'statistics.animalsCollected': _.inc(actualCount)
        }
      });

      // 如果抽到USR动物，记录特殊日志
      const usrAnimals = recruitResults.filter(animal => animal.rarity === 'USR');
      if (usrAnimals.length > 0) {
        for (const usrAnimal of usrAnimals) {
          await transaction.collection('admin_logs').add({
            data: {
              adminId: 'system',
              action: 'usr_animal_recruited',
              targetType: 'user',
              targetId: openid,
              details: { 
                breedId: usrAnimal.breedId,
                boxType,
                currency
              },
              timestamp: new Date()
            }
          });
        }
      }
    });

    logger.info(`User ${openid} recruited ${actualCount} animals using ${boxType} with ${currency}`);

    // 计算稀有度统计
    const rarityStats = {};
    recruitResults.forEach(animal => {
      rarityStats[animal.rarity] = (rarityStats[animal.rarity] || 0) + 1;
    });

    return {
      code: 200,
      message: 'Animal recruitment completed successfully',
      data: {
        recruitedAnimals: createdAnimals,
        totalCost,
        currency,
        boxType,
        rarityStats,
        guaranteeTriggered: boxType === 'ten_pull' && !recruitResults.slice(0, 9).some(a => ['SR', 'SSR', 'USR'].includes(a.rarity))
      }
    };

  } catch (err) {
    logger.error(`Error in recruit_animal for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error', error: err.message };
  }
};

/**
 * 获取招募配置
 */
function getRecruitConfiguration(boxType, currency) {
  const configs = {
    single: {
      gold: { cost: 1000, rateBoost: 1.0 },
      gems: { cost: 100, rateBoost: 1.2 }
    },
    ten_pull: {
      gold: { cost: 9000, rateBoost: 1.0 }, // 10%折扣
      gems: { cost: 900, rateBoost: 1.3 }    // 10%折扣 + 更高概率
    }
  };

  return configs[boxType][currency];
}

/**
 * 执行招募
 */
function performRecruitment(animalBreeds, config, isLastInTenPull = false) {
  // 基础稀有度概率
  let rarityRates = {
    'N': 0.60,
    'R': 0.30,
    'SR': 0.08,
    'SSR': 0.018,
    'USR': 0.002
  };

  // 应用稀有度加成
  if (config.rateBoost > 1.0) {
    const boost = config.rateBoost - 1.0;
    rarityRates['SR'] += boost * 0.02;
    rarityRates['SSR'] += boost * 0.01;
    rarityRates['USR'] += boost * 0.005;
    rarityRates['R'] -= boost * 0.02;
    rarityRates['N'] -= boost * 0.015;
  }

  // 选择稀有度
  const rarity = selectRarity(rarityRates);
  
  // 从对应稀有度中选择动物
  const availableBreeds = animalBreeds.filter(breed => breed.rarity === rarity);
  const selectedBreed = availableBreeds[Math.floor(Math.random() * availableBreeds.length)];

  return selectedBreed;
}

/**
 * 选择稀有度
 */
function selectRarity(rarityRates) {
  const random = Math.random();
  let cumulative = 0;

  for (const [rarity, rate] of Object.entries(rarityRates)) {
    cumulative += rate;
    if (random <= cumulative) {
      return rarity;
    }
  }

  return 'N'; // fallback
}

/**
 * 获取保底动物
 */
function getGuaranteedAnimal(animalBreeds, guaranteedRarity) {
  const guaranteedBreeds = animalBreeds.filter(breed => breed.rarity === guaranteedRarity);
  return guaranteedBreeds[Math.floor(Math.random() * guaranteedBreeds.length)];
}

/**
 * 生成动物名称
 */
function generateAnimalName(breedData) {
  const prefixes = ['小', '大', '萌', '乖', '胖', '瘦', '美', '帅'];
  const suffixes = ['宝', '仔', '妹', '哥', '公主', '王子', '大人', '君'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${breedData.name.slice(0, 1)}${suffix}`;
}