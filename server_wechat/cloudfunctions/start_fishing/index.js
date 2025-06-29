const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 开始钓鱼 - 后院渔场系统
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { animalIds, baitId, collaborators, fishingDuration } = event;

  if (!openid) {
    return { code: 401, message: 'Unauthorized. User OPENID not found.' };
  }

  if (!animalIds || animalIds.length === 0) {
    return { code: 400, message: 'At least one animal is required for fishing.' };
  }

  try {
    // 验证动物是否可用
    const animalsResult = await db.collection('animals')
      .where({
        _id: _.in(animalIds),
        ownerId: openid,
        status: 'idle'
      })
      .get();

    if (animalsResult.data.length !== animalIds.length) {
      return { code: 400, message: 'Some animals are not available for fishing.' };
    }

    const animals = animalsResult.data;

    // 检查是否有疲劳的动物
    const tiredAnimals = animals.filter(animal => animal.fatigue > 80);
    if (tiredAnimals.length > 0) {
      return { code: 400, message: 'Some animals are too tired to fish. Let them rest first.' };
    }

    // 验证鱼饵（如果使用）
    let baitConfig = null;
    if (baitId) {
      const userResult = await db.collection('users').doc(openid).get();
      const inventory = userResult.data?.inventory || {};
      
      if (!inventory[baitId] || inventory[baitId] < 1) {
        return { code: 400, message: 'Not enough bait in inventory.' };
      }

      // 获取鱼饵配置
      const itemsConfigResult = await db.collection('game_configs').doc('items').get();
      const items = itemsConfigResult.data?.data || [];
      baitConfig = items.find(item => item.itemId === baitId && item.type === 'bait');
      
      if (!baitConfig) {
        return { code: 400, message: 'Invalid bait item.' };
      }
    }

    // 验证协作者（如果有）
    let validCollaborators = [];
    if (collaborators && collaborators.length > 0) {
      const collaboratorResults = await db.collection('users')
        .where({
          _openid: _.in(collaborators)
        })
        .get();
      
      validCollaborators = collaboratorResults.data.map(user => user._openid);
    }

    // 计算钓鱼时间和幸运加成
    const duration = fishingDuration || 1800000; // 默认30分钟
    const totalLuck = animals.reduce((sum, animal) => sum + (animal.attributes.luck || 0), 0);
    const baseLuckBonus = 1 + (totalLuck / 100);
    const baitBonus = baitConfig ? (baitConfig.effect.luckMultiplier || 1) : 1;
    const collaboratorBonus = validCollaborators.length > 0 ? 1.2 : 1;
    
    const finalLuckBonus = baseLuckBonus * baitBonus * collaboratorBonus;

    const now = new Date();
    const endTime = new Date(now.getTime() + duration);

    // 使用事务创建钓鱼会话并更新动物状态
    let fishingSessionId;
    await db.runTransaction(async transaction => {
      // 更新动物状态
      for (const animalId of animalIds) {
        await transaction.collection('animals').doc(animalId).update({
          data: {
            status: 'fishing'
          }
        });
      }

      // 扣除鱼饵
      if (baitId) {
        await transaction.collection('users').doc(openid).update({
          data: {
            [`inventory.${baitId}`]: _.inc(-1)
          }
        });
      }

      // 创建钓鱼会话
      const fishingSession = {
        ownerId: openid,
        animalIds: animalIds,
        collaborators: validCollaborators,
        startTime: now,
        endTime: endTime,
        status: 'active',
        catches: [],
        baitUsed: baitId,
        luckBonus: finalLuckBonus,
        baseDuration: duration
      };

      const sessionResult = await transaction.collection('fishing_sessions').add({
        data: fishingSession
      });
      
      fishingSessionId = sessionResult._id;

      // 如果有协作者，通知他们
      if (validCollaborators.length > 0) {
        for (const collaborator of validCollaborators) {
          await transaction.collection('social_actions').add({
            data: {
              fromUserId: openid,
              toUserId: collaborator,
              actionType: 'fishing_invitation',
              relatedId: fishingSessionId,
              status: 'pending',
              reward: { fishingBonus: true },
              createdAt: now,
              expiredAt: endTime
            }
          });
        }
      }
    });

    console.log(`Fishing session started for user ${openid} with animals: ${animalIds.join(', ')}`);

    return {
      code: 200,
      message: 'Fishing session started successfully',
      data: {
        sessionId: fishingSessionId,
        animalIds,
        duration,
        endTime,
        luckBonus: finalLuckBonus,
        collaborators: validCollaborators,
        baitUsed: baitId
      }
    };

  } catch (err) {
    console.error(`Error in start_fishing for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error', error: err.message };
  }
};