const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 处理外卖事件选择 - 用户对外卖江湖随机事件做出选择
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { deliveryId, choiceId } = event;

  if (!openid) {
    return { code: 401, message: 'Unauthorized. User OPENID not found.' };
  }

  if (!deliveryId || !choiceId) {
    return { code: 400, message: 'deliveryId and choiceId are required.' };
  }

  try {
    // 获取配送事件数据
    const deliveryResult = await db.collection('delivery_events').doc(deliveryId).get();
    
    if (!deliveryResult.data || deliveryResult.data.ownerId !== openid) {
      return { code: 404, message: 'Delivery event not found or not owned by user.' };
    }

    const delivery = deliveryResult.data;

    if (delivery.status !== 'waiting_choice') {
      return { code: 400, message: 'Delivery event is not waiting for choice.' };
    }

    // 检查选择是否有效
    const validChoice = delivery.choices.find(choice => choice.id === choiceId);
    if (!validChoice) {
      return { code: 400, message: 'Invalid choice ID.' };
    }

    // 获取事件配置
    const eventsConfigResult = await db.collection('game_configs').doc('delivery_events').get();
    const eventsConfig = eventsConfigResult.data?.data || [];
    const eventConfig = eventsConfig.find(e => e.eventId === delivery.eventId);

    if (!eventConfig) {
      return { code: 500, message: 'Event configuration not found.' };
    }

    // 计算选择结果
    const choiceConfig = eventConfig.choices.find(c => c.id === choiceId);
    const result = calculateEventResult(choiceConfig);

    // 应用结果
    const appliedResult = await applyEventResult(openid, delivery.animalId, result);

    // 使用事务更新配送状态和用户数据
    await db.runTransaction(async transaction => {
      // 更新配送事件状态
      await transaction.collection('delivery_events').doc(deliveryId).update({
        data: {
          status: 'completed',
          selectedChoice: choiceId,
          result: appliedResult,
          completedAt: new Date()
        }
      });

      // 更新动物状态为空闲
      await transaction.collection('animals').doc(delivery.animalId).update({
        data: {
          status: 'idle',
          fatigue: _.inc(10) // 增加一些疲劳值
        }
      });

      // 应用奖励或惩罚
      if (appliedResult.goldReward && appliedResult.goldReward !== 0) {
        await transaction.collection('users').doc(openid).update({
          data: {
            gold: _.inc(appliedResult.goldReward)
          }
        });

        // 记录交易日志
        await transaction.collection('user_transactions').add({
          data: {
            userId: openid,
            type: appliedResult.goldReward > 0 ? 'earn' : 'spend',
            currency: 'gold',
            amount: Math.abs(appliedResult.goldReward),
            reason: 'delivery_event_result',
            relatedId: deliveryId,
            timestamp: new Date()
          }
        });
      }

      // 应用道具奖励
      if (appliedResult.itemReward) {
        await transaction.collection('users').doc(openid).update({
          data: {
            [`inventory.${appliedResult.itemReward}`]: _.inc(1)
          }
        });
      }

      // 应用负面效果（如果有）
      if (appliedResult.debuff) {
        const debuffEndTime = new Date();
        debuffEndTime.setTime(debuffEndTime.getTime() + 3600000); // 1小时
        
        await transaction.collection('animals').doc(delivery.animalId).update({
          data: {
            [`debuffs.${appliedResult.debuff}`]: debuffEndTime
          }
        });
      }
    });

    console.log(`Delivery choice handled for ${openid}: ${choiceId}, result: ${appliedResult.message}`);

    return {
      code: 200,
      message: 'Choice handled successfully',
      data: {
        deliveryId,
        choiceId,
        result: appliedResult,
        eventName: eventConfig.name
      }
    };

  } catch (err) {
    console.error(`Error in handle_delivery_choice for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error', error: err.message };
  }
};

/**
 * 计算事件结果
 */
function calculateEventResult(choiceConfig) {
  if (!choiceConfig.outcomes || choiceConfig.outcomes.length === 0) {
    return { message: '平安无事' };
  }

  // 基于概率选择结果
  const random = Math.random();
  let cumulativeProbability = 0;

  for (const outcome of choiceConfig.outcomes) {
    cumulativeProbability += outcome.probability;
    if (random <= cumulativeProbability) {
      return outcome.result;
    }
  }

  // 如果没有匹配到（理论上不应该发生），返回最后一个结果
  return choiceConfig.outcomes[choiceConfig.outcomes.length - 1].result;
}

/**
 * 应用事件结果
 */
async function applyEventResult(openid, animalId, result) {
  const appliedResult = {
    message: result.message || '发生了一些事情...',
    goldReward: 0,
    itemReward: null,
    debuff: null
  };

  // 处理金币奖励/损失
  if (result.goldReward) {
    appliedResult.goldReward = result.goldReward;
  } else if (result.goldLoss) {
    appliedResult.goldReward = -result.goldLoss;
  }

  // 处理道具奖励
  if (result.itemReward) {
    appliedResult.itemReward = result.itemReward;
  }

  // 处理负面效果
  if (result.debuff) {
    appliedResult.debuff = result.debuff;
  }

  return appliedResult;
}