const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 完成钓鱼 - 收取钓鱼成果
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { sessionId } = event;

  if (!openid) {
    return { code: 401, message: 'Unauthorized. User OPENID not found.' };
  }

  if (!sessionId) {
    return { code: 400, message: 'sessionId is required.' };
  }

  try {
    // 获取钓鱼会话数据
    const sessionResult = await db.collection('fishing_sessions').doc(sessionId).get();
    
    if (!sessionResult.data || sessionResult.data.ownerId !== openid) {
      return { code: 404, message: 'Fishing session not found or not owned by user.' };
    }

    const session = sessionResult.data;

    if (session.status !== 'active') {
      return { code: 400, message: 'Fishing session is not active.' };
    }

    const now = new Date();
    const endTime = new Date(session.endTime);

    // 检查是否已到钓鱼结束时间
    if (now < endTime) {
      const remainingTime = endTime.getTime() - now.getTime();
      return { 
        code: 400, 
        message: 'Fishing session is not complete yet.',
        data: { remainingTime }
      };
    }

    // 计算钓鱼收获
    const catches = await calculateFishingCatches(session);

    // 使用事务更新数据
    await db.runTransaction(async transaction => {
      // 更新钓鱼会话状态
      await transaction.collection('fishing_sessions').doc(sessionId).update({
        data: {
          status: 'completed',
          catches: catches,
          completedAt: now
        }
      });

      // 更新动物状态为空闲，增加疲劳值，但降低心情值（钓鱼是放松的）
      for (const animalId of session.animalIds) {
        await transaction.collection('animals').doc(animalId).update({
          data: {
            status: 'idle',
            fatigue: _.inc(-20), // 钓鱼降低疲劳
            mood: _.inc(15) // 钓鱼提升心情
          }
        });
      }

      // 添加收获到用户仓库
      const inventoryUpdates = {};
      for (const catchItem of catches) {
        inventoryUpdates[`inventory.${catchItem.itemId}`] = _.inc(catchItem.count);
      }

      if (Object.keys(inventoryUpdates).length > 0) {
        await transaction.collection('users').doc(openid).update({
          data: inventoryUpdates
        });
      }

      // 更新用户渔场统计
      await transaction.collection('users').doc(openid).update({
        data: {
          'fishing.totalSessions': _.inc(1),
          'fishing.totalCatches': _.inc(catches.length),
          'fishing.lastFishingTime': now
        }
      });

      // 记录交易日志
      for (const catchItem of catches) {
        await transaction.collection('user_transactions').add({
          data: {
            userId: openid,
            type: 'earn',
            currency: 'items',
            amount: catchItem.count,
            reason: 'fishing_reward',
            relatedId: sessionId,
            details: { itemId: catchItem.itemId, itemName: catchItem.name },
            timestamp: now
          }
        });
      }

      // 如果有协作者，给他们发放奖励
      if (session.collaborators && session.collaborators.length > 0) {
        for (const collaborator of session.collaborators) {
          const collaboratorReward = Math.floor(catches.length * 0.3); // 协作者获得30%的基础金币奖励
          
          if (collaboratorReward > 0) {
            await transaction.collection('users').doc(collaborator).update({
              data: {
                gold: _.inc(collaboratorReward)
              }
            });

            await transaction.collection('user_transactions').add({
              data: {
                userId: collaborator,
                type: 'earn',
                currency: 'gold',
                amount: collaboratorReward,
                reason: 'fishing_collaboration_reward',
                relatedId: sessionId,
                timestamp: now
              }
            });
          }
        }
      }
    });

    console.log(`Fishing session ${sessionId} completed for user ${openid}, caught ${catches.length} items`);

    return {
      code: 200,
      message: 'Fishing session completed successfully',
      data: {
        sessionId,
        catches,
        totalItems: catches.reduce((sum, item) => sum + item.count, 0),
        collaboratorRewards: session.collaborators.length * Math.floor(catches.length * 0.3)
      }
    };

  } catch (err) {
    console.error(`Error in complete_fishing for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error', error: err.message };
  }
};

/**
 * 计算钓鱼收获
 */
async function calculateFishingCatches(session) {
  const catches = [];
  
  // 基础钓鱼次数 = 动物数量 * 时间(分钟) / 10
  const durationMinutes = Math.floor(session.baseDuration / 60000);
  const baseCatchAttempts = session.animalIds.length * Math.floor(durationMinutes / 10);
  
  // 应用幸运加成
  const totalCatchAttempts = Math.floor(baseCatchAttempts * session.luckBonus);

  // 获取鱼类配置
  const fishConfig = await getFishConfiguration();
  
  for (let i = 0; i < totalCatchAttempts; i++) {
    const catchResult = attemptCatch(fishConfig, session.luckBonus);
    if (catchResult) {
      // 查找是否已经有相同的物品
      const existingCatch = catches.find(c => c.itemId === catchResult.itemId);
      if (existingCatch) {
        existingCatch.count++;
      } else {
        catches.push({
          itemId: catchResult.itemId,
          name: catchResult.name,
          rarity: catchResult.rarity,
          count: 1
        });
      }
    }
  }

  // 特殊奖励：漂流瓶（低概率）
  if (Math.random() < 0.1 * session.luckBonus) {
    catches.push({
      itemId: 'drift_bottle',
      name: '神秘漂流瓶',
      rarity: 'rare',
      count: 1
    });
  }

  return catches;
}

/**
 * 获取鱼类配置
 */
async function getFishConfiguration() {
  // 这里应该从配置中获取，为了简化，直接返回预设配置
  return [
    { itemId: 'fish_common_1', name: '小鲫鱼', rarity: 'common', weight: 50 },
    { itemId: 'fish_common_2', name: '小鲤鱼', rarity: 'common', weight: 40 },
    { itemId: 'fish_uncommon_1', name: '草鱼', rarity: 'uncommon', weight: 30 },
    { itemId: 'fish_uncommon_2', name: '鲈鱼', rarity: 'uncommon', weight: 25 },
    { itemId: 'fish_rare_1', name: '金鱼', rarity: 'rare', weight: 10 },
    { itemId: 'fish_rare_2', name: '锦鲤', rarity: 'rare', weight: 8 },
    { itemId: 'fish_epic_1', name: '龙鱼', rarity: 'epic', weight: 3 },
    { itemId: 'fish_legendary_1', name: '传说之鱼', rarity: 'legendary', weight: 1 }
  ];
}

/**
 * 尝试钓鱼
 */
function attemptCatch(fishConfig, luckBonus) {
  // 70%基础成功率，幸运值影响
  const successRate = Math.min(0.95, 0.7 + (luckBonus - 1) * 0.3);
  
  if (Math.random() > successRate) {
    return null; // 没钓到
  }

  // 基于权重随机选择鱼类
  const totalWeight = fishConfig.reduce((sum, fish) => sum + fish.weight, 0);
  let random = Math.random() * totalWeight;

  for (const fish of fishConfig) {
    random -= fish.weight;
    if (random <= 0) {
      return fish;
    }
  }

  return fishConfig[0]; // fallback
}