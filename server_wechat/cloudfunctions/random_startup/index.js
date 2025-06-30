const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 随机开局系统 - 为新用户生成随机的开局剧本
 * 包括天胡开局、标准开局、地狱开局
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { code: 401, message: 'Unauthorized. User OPENID not found.' };
  }

  try {
    // 检查用户是否已经完成开局
    const userResult = await db.collection('users').doc(openid).get();
    
    if (!userResult.data) {
      return { code: 404, message: 'User not found. Please login first.' };
    }

    if (userResult.data.debut && userResult.data.debut.completed) {
      return { code: 400, message: 'User has already completed startup process.' };
    }

    // 获取开局剧本配置
    const configResult = await db.collection('game_configs').doc('startup_scenarios').get();
    
    if (!configResult.data || !configResult.data.data) {
      return { code: 500, message: 'Startup scenarios configuration not found.' };
    }

    const scenarios = configResult.data.data;
    
    // 加权随机选择开局剧本
    const totalWeight = scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedScenario = null;
    for (const scenario of scenarios) {
      random -= scenario.weight;
      if (random <= 0) {
        selectedScenario = scenario;
        break;
      }
    }

    if (!selectedScenario) {
      selectedScenario = scenarios[0]; // fallback
    }

    // 执行开局奖励
    const startupRewards = await applyStartupRewards(openid, selectedScenario);

    // 更新用户开局信息
    await db.collection('users').doc(openid).update({
      data: {
        debut: {
          scenarioId: selectedScenario.scenarioId,
          type: selectedScenario.rarity,
          description: selectedScenario.description,
          completed: true,
          completedAt: new Date(),
          rewards: startupRewards
        }
      }
    });

    console.log(`User ${openid} completed startup with scenario: ${selectedScenario.scenarioId}`);

    return {
      code: 200,
      message: 'Startup completed successfully',
      data: {
        scenario: selectedScenario,
        rewards: startupRewards
      }
    };

  } catch (err) {
    console.error(`Error in random_startup for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error', error: err.message };
  }
};

/**
 * 应用开局奖励
 */
async function applyStartupRewards(openid, scenario) {
  const rewards = scenario.rewards;
  const appliedRewards = {};

  // 使用事务确保数据一致性
  await db.runTransaction(async transaction => {
    // 更新金币和钻石
    if (rewards.gold) {
      await transaction.collection('users').doc(openid).update({
        data: {
          gold: _.inc(rewards.gold)
        }
      });
      appliedRewards.gold = rewards.gold;
    }

    if (rewards.gems) {
      await transaction.collection('users').doc(openid).update({
        data: {
          gems: _.inc(rewards.gems)
        }
      });
      appliedRewards.gems = rewards.gems;
    }

    // 添加初始动物
    if (rewards.animals && rewards.animals.length > 0) {
      appliedRewards.animals = [];
      
      for (const animalReward of rewards.animals) {
        const newAnimal = {
          ownerId: openid,
          species: animalReward.breedId.split('_')[0], // 从breedId提取species
          breedId: animalReward.breedId,
          name: `${animalReward.breedId}_${Date.now()}`, // 临时名称，用户可以修改
          level: animalReward.level || 1,
          exp: 0,
          status: 'idle',
          assignedPost: '',
          skills: [],
          attributes: {
            speed: 5,
            luck: 1,
            cooking: 3,
            charm: 2,
            stamina: 10
          },
          fatigue: 0,
          mood: 100,
          outfit: '',
          contractInfo: null,
          createdAt: new Date()
        };

        const addResult = await transaction.collection('animals').add({
          data: newAnimal
        });

        appliedRewards.animals.push({
          id: addResult._id,
          ...newAnimal
        });
      }
    }

    // 处理债务（地狱开局）
    if (rewards.debt) {
      await transaction.collection('users').doc(openid).update({
        data: {
          debt: rewards.debt
        }
      });
      appliedRewards.debt = rewards.debt;
    }
  });

  return appliedRewards;
}