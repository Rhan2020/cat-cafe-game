const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 每日祈愿转盘 - 转盘抽奖系统
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { spinType } = event; // 'free', 'ad', 'paid'

  if (!openid) {
    return { code: 401, message: 'Unauthorized. User OPENID not found.' };
  }

  if (!spinType || !['free', 'ad', 'paid'].includes(spinType)) {
    return { code: 400, message: 'Invalid spinType. Must be free, ad, or paid.' };
  }

  try {
    // 获取用户数据
    const userResult = await db.collection('users').doc(openid).get();
    
    if (!userResult.data) {
      return { code: 404, message: 'User not found.' };
    }

    const user = userResult.data;
    const now = new Date();
    const today = now.toDateString();

    // 检查每日数据
    let dailyData = user.dailyData || {};
    const lastWheelReset = dailyData.lastWheelReset;
    
    // 如果是新的一天，重置每日转盘次数
    if (!lastWheelReset || new Date(lastWheelReset).toDateString() !== today) {
      dailyData = {
        wheelSpins: 0,
        adWheelSpins: 0,
        lastWheelReset: today,
        freeSpinUsed: false
      };
    }

    // 验证转盘次数
    const validation = validateSpinAttempt(spinType, dailyData, user);
    if (!validation.valid) {
      return { code: 400, message: validation.message };
    }

    // 获取转盘奖励配置
    const wheelConfigResult = await db.collection('game_configs').doc('wheel_rewards').get();
    
    if (!wheelConfigResult.data || !wheelConfigResult.data.data) {
      return { code: 500, message: 'Wheel rewards configuration not found.' };
    }

    const rewards = wheelConfigResult.data.data;
    
    // 选择奖励
    const selectedReward = selectRandomReward(rewards);
    
    // 应用奖励
    const appliedReward = await applyWheelReward(openid, selectedReward);

    // 使用事务更新用户数据
    await db.runTransaction(async transaction => {
      // 更新每日数据
      const updateData = {};
      
      if (spinType === 'free') {
        updateData['dailyData.freeSpinUsed'] = true;
      } else if (spinType === 'ad') {
        updateData['dailyData.adWheelSpins'] = _.inc(1);
      } else if (spinType === 'paid') {
        // 扣除钻石
        updateData.gems = _.inc(-validation.cost);
      }
      
      updateData['dailyData.wheelSpins'] = _.inc(1);
      updateData['dailyData.lastWheelReset'] = today;

      await transaction.collection('users').doc(openid).update({
        data: updateData
      });

      // 应用奖励
      if (selectedReward.type === 'gold') {
        await transaction.collection('users').doc(openid).update({
          data: {
            gold: _.inc(selectedReward.amount)
          }
        });
      } else if (selectedReward.type === 'gems') {
        await transaction.collection('users').doc(openid).update({
          data: {
            gems: _.inc(selectedReward.amount)
          }
        });
      } else if (selectedReward.type === 'item') {
        await transaction.collection('users').doc(openid).update({
          data: {
            [`inventory.${selectedReward.itemId}`]: _.inc(selectedReward.amount)
          }
        });
      }

      // 记录交易日志
      await transaction.collection('user_transactions').add({
        data: {
          userId: openid,
          type: 'earn',
          currency: selectedReward.type,
          amount: selectedReward.amount,
          reason: 'daily_wheel_reward',
          relatedId: `wheel_${selectedReward.id}`,
          details: { spinType, rewardId: selectedReward.id },
          timestamp: now
        }
      });

      // 如果抽到命运怀表，记录特殊日志
      if (selectedReward.itemId === 'fate_watch') {
        await transaction.collection('admin_logs').add({
          data: {
            adminId: 'system',
            action: 'rare_item_obtained',
            targetType: 'user',
            targetId: openid,
            details: { 
              itemId: 'fate_watch',
              source: 'daily_wheel',
              spinType
            },
            timestamp: now
          }
        });
      }
    });

    console.log(`User ${openid} spun wheel (${spinType}) and got ${selectedReward.name}`);

    return {
      code: 200,
      message: 'Wheel spun successfully',
      data: {
        reward: {
          id: selectedReward.id,
          name: selectedReward.name,
          type: selectedReward.type,
          amount: selectedReward.amount,
          itemId: selectedReward.itemId
        },
        spinType,
        remainingSpins: {
          free: !dailyData.freeSpinUsed ? 1 : 0,
          ad: Math.max(0, 5 - (dailyData.adWheelSpins + 1)),
          paid: 999 // 付费转盘理论上无限制
        }
      }
    };

  } catch (err) {
    console.error(`Error in spin_daily_wheel for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error', error: err.message };
  }
};

/**
 * 验证转盘次数
 */
function validateSpinAttempt(spinType, dailyData, user) {
  switch (spinType) {
    case 'free':
      if (dailyData.freeSpinUsed) {
        return { valid: false, message: 'Free spin already used today.' };
      }
      return { valid: true };

    case 'ad':
      const adSpins = dailyData.adWheelSpins || 0;
      if (adSpins >= 5) {
        return { valid: false, message: 'Maximum ad spins reached for today.' };
      }
      return { valid: true };

    case 'paid':
      const cost = 50; // 50钻石一次
      if (!user.gems || user.gems < cost) {
        return { valid: false, message: 'Not enough gems for paid spin.' };
      }
      return { valid: true, cost };

    default:
      return { valid: false, message: 'Invalid spin type.' };
  }
}

/**
 * 基于权重随机选择奖励
 */
function selectRandomReward(rewards) {
  const totalWeight = rewards.reduce((sum, reward) => sum + reward.weight, 0);
  let random = Math.random() * totalWeight;

  for (const reward of rewards) {
    random -= reward.weight;
    if (random <= 0) {
      return reward;
    }
  }

  return rewards[0]; // fallback
}

/**
 * 应用转盘奖励
 */
async function applyWheelReward(openid, reward) {
  // 这里可以添加特殊奖励的额外逻辑
  // 比如命运怀表的特殊处理
  
  return {
    applied: true,
    reward: reward
  };
}