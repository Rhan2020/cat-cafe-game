const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 好友助力 - 处理好友间的互助行为
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { actionId, actionType } = event;

  if (!openid) {
    return { code: 401, message: 'Unauthorized. User OPENID not found.' };
  }

  if (!actionId) {
    return { code: 400, message: 'actionId is required.' };
  }

  try {
    // 获取社交行为数据
    const actionResult = await db.collection('social_actions').doc(actionId).get();
    
    if (!actionResult.data) {
      return { code: 404, message: 'Social action not found.' };
    }

    const action = actionResult.data;

    // 验证用户是否为目标用户
    if (action.toUserId !== openid) {
      return { code: 403, message: 'You are not the target user for this action.' };
    }

    if (action.status !== 'pending') {
      return { code: 400, message: 'This action has already been processed or expired.' };
    }

    // 检查是否过期
    const now = new Date();
    if (action.expiredAt && new Date(action.expiredAt) < now) {
      // 标记为过期
      await db.collection('social_actions').doc(actionId).update({
        data: { status: 'expired' }
      });
      return { code: 400, message: 'This action has expired.' };
    }

    let helpResult = {};

    // 根据不同的行为类型处理
    switch (action.actionType) {
      case 'help_delivery':
        helpResult = await handleDeliveryHelp(action);
        break;
      case 'fishing_invitation':
        helpResult = await handleFishingInvitation(action, openid);
        break;
      case 'gift_item':
        helpResult = await handleGiftItem(action, openid);
        break;
      default:
        return { code: 400, message: 'Unknown action type.' };
    }

    // 使用事务更新状态和发放奖励
    await db.runTransaction(async transaction => {
      // 更新社交行为状态
      await transaction.collection('social_actions').doc(actionId).update({
        data: {
          status: 'completed',
          completedAt: now,
          result: helpResult
        }
      });

      // 给助力者发放奖励
      const helperReward = action.reward || {};
      if (helperReward.gold) {
        await transaction.collection('users').doc(openid).update({
          data: {
            gold: _.inc(helperReward.gold)
          }
        });

        await transaction.collection('user_transactions').add({
          data: {
            userId: openid,
            type: 'earn',
            currency: 'gold',
            amount: helperReward.gold,
            reason: 'friend_help_reward',
            relatedId: actionId,
            timestamp: now
          }
        });
      }

      // 应用具体的帮助结果
      if (helpResult.targetUserReward) {
        const targetReward = helpResult.targetUserReward;
        const updateData = {};

        if (targetReward.gold) {
          updateData.gold = _.inc(targetReward.gold);
        }
        if (targetReward.gems) {
          updateData.gems = _.inc(targetReward.gems);
        }

        if (Object.keys(updateData).length > 0) {
          await transaction.collection('users').doc(action.fromUserId).update({
            data: updateData
          });
        }
      }

      // 处理特定行为的额外逻辑
      if (helpResult.additionalActions) {
        for (const additionalAction of helpResult.additionalActions) {
          await executeAdditionalAction(transaction, additionalAction);
        }
      }
    });

    logger.info(`Friend help completed: ${openid} helped ${action.fromUserId} with ${action.actionType}`);

    return {
      code: 200,
      message: 'Help completed successfully',
      data: {
        actionId,
        actionType: action.actionType,
        reward: action.reward,
        helpResult
      }
    };

  } catch (err) {
    logger.error(`Error in help_friend for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error', error: err.message };
  }
};

/**
 * 处理外卖助力
 */
async function handleDeliveryHelp(action) {
  const deliveryId = action.relatedId;
  
  // 获取外卖事件
  const deliveryResult = await db.collection('delivery_events').doc(deliveryId).get();
  
  if (!deliveryResult.data) {
    throw new Error('Related delivery event not found');
  }

  const delivery = deliveryResult.data;

  // 解决外卖危机
  const resolution = {
    method: 'friend_help',
    goldReward: 100,
    message: '好友的及时帮助解决了危机！'
  };

  // 更新外卖事件状态
  await db.collection('delivery_events').doc(deliveryId).update({
    data: {
      status: 'completed',
      result: resolution,
      completedAt: new Date()
    }
  });

  // 更新动物状态为空闲
  await db.collection('animals').doc(delivery.animalId).update({
    data: {
      status: 'idle'
    }
  });

  return {
    type: 'delivery_help',
    success: true,
    targetUserReward: { gold: resolution.goldReward },
    message: resolution.message
  };
}

/**
 * 处理钓鱼邀请
 */
async function handleFishingInvitation(action, helperId) {
  const sessionId = action.relatedId;
  
  // 获取钓鱼会话
  const sessionResult = await db.collection('fishing_sessions').doc(sessionId).get();
  
  if (!sessionResult.data) {
    throw new Error('Related fishing session not found');
  }

  const session = sessionResult.data;

  // 如果钓鱼还在进行中，增加协作者
  if (session.status === 'active') {
    const updatedCollaborators = [...(session.collaborators || [])];
    if (!updatedCollaborators.includes(helperId)) {
      updatedCollaborators.push(helperId);
      
      await db.collection('fishing_sessions').doc(sessionId).update({
        data: {
          collaborators: updatedCollaborators,
          luckBonus: _.inc(0.1) // 增加10%幸运加成
        }
      });
    }
  }

  return {
    type: 'fishing_invitation',
    success: true,
    message: '成功加入协作钓鱼！'
  };
}

/**
 * 处理物品赠送
 */
async function handleGiftItem(action, helperId) {
  // 这里可以实现物品赠送的逻辑
  // 暂时返回简单的确认
  return {
    type: 'gift_item',
    success: true,
    message: '礼物已收到！'
  };
}

/**
 * 执行额外动作
 */
async function executeAdditionalAction(transaction, action) {
  switch (action.type) {
    case 'update_animal_status':
      await transaction.collection('animals').doc(action.animalId).update({
        data: { status: action.newStatus }
      });
      break;
    case 'add_item':
      await transaction.collection('users').doc(action.userId).update({
        data: {
          [`inventory.${action.itemId}`]: _.inc(action.amount)
        }
      });
      break;
    // 可以添加更多动作类型
  }
}