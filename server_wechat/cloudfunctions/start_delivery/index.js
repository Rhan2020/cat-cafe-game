const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 开始外卖配送 - 启动外卖任务，可能触发随机事件
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { animalId } = event;

  if (!openid) {
    return { code: 401, message: 'Unauthorized. User OPENID not found.' };
  }

  if (!animalId) {
    return { code: 400, message: 'animalId is required.' };
  }

  try {
    // 检查动物是否存在且可用
    const animalResult = await db.collection('animals').doc(animalId).get();
    
    if (!animalResult.data || animalResult.data.ownerId !== openid) {
      return { code: 404, message: 'Animal not found or not owned by user.' };
    }

    const animal = animalResult.data;

    if (animal.status !== 'idle') {
      return { code: 400, message: 'Animal is not available for delivery.' };
    }

    // 检查是否有进行中的配送
    const activeDeliveryResult = await db.collection('delivery_events')
      .where({ 
        ownerId: openid, 
        animalId: animalId,
        status: _.in(['in_progress', 'waiting_choice'])
      })
      .get();

    if (activeDeliveryResult.data.length > 0) {
      return { code: 400, message: 'Animal already has an active delivery.' };
    }

    // 计算配送时间（基于动物属性）
    const baseDeliveryTime = 300000; // 5分钟基础时间
    const speedModifier = Math.max(0.5, 1 - (animal.attributes.speed / 100));
    const deliveryTime = Math.floor(baseDeliveryTime * speedModifier);

    const now = new Date();
    const endTime = new Date(now.getTime() + deliveryTime);

    // 计算是否触发随机事件（基于幸运值）
    const eventTriggerChance = 0.3 + (animal.attributes.luck / 200); // 30%基础概率 + 幸运值加成
    const willTriggerEvent = Math.random() < eventTriggerChance;

    let deliveryData = {
      ownerId: openid,
      animalId: animalId,
      eventType: 'normal_delivery',
      status: 'in_progress',
      startTime: now,
      endTime: endTime,
      result: null
    };

    let eventDetails = null;

    if (willTriggerEvent) {
      // 获取随机事件配置
      const eventsConfigResult = await db.collection('game_configs').doc('delivery_events').get();
      
      if (eventsConfigResult.data && eventsConfigResult.data.data) {
        const events = eventsConfigResult.data.data;
        const selectedEvent = selectRandomEvent(events);
        
        if (selectedEvent) {
          deliveryData.eventType = 'random_event';
          deliveryData.eventId = selectedEvent.eventId;
          deliveryData.status = 'waiting_choice';
          deliveryData.choices = selectedEvent.choices;
          deliveryData.timeoutAction = selectedEvent.defaultChoice;
          
          // 如果有时间限制，设置超时时间
          if (selectedEvent.timeLimit) {
            deliveryData.choiceTimeout = new Date(now.getTime() + selectedEvent.timeLimit);
          }

          eventDetails = {
            eventId: selectedEvent.eventId,
            name: selectedEvent.name,
            description: selectedEvent.description,
            choices: selectedEvent.choices,
            timeLimit: selectedEvent.timeLimit
          };
        }
      }
    }

    // 使用事务创建配送事件并更新动物状态
    let deliveryId;
    await db.runTransaction(async transaction => {
      // 更新动物状态
      await transaction.collection('animals').doc(animalId).update({
        data: {
          status: 'delivery'
        }
      });

      // 创建配送事件
      const deliveryResult = await transaction.collection('delivery_events').add({
        data: deliveryData
      });
      
      deliveryId = deliveryResult._id;
    });

    logger.info(`Delivery started for animal ${animalId}, event triggered: ${willTriggerEvent}`);

    return {
      code: 200,
      message: 'Delivery started successfully',
      data: {
        deliveryId,
        animalId,
        estimatedDuration: deliveryTime,
        endTime,
        eventTriggered: willTriggerEvent,
        eventDetails
      }
    };

  } catch (err) {
    logger.error(`Error in start_delivery for user ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error', error: err.message };
  }
};

/**
 * 基于权重随机选择事件
 */
function selectRandomEvent(events) {
  if (!events || events.length === 0) return null;

  const totalWeight = events.reduce((sum, event) => sum + (event.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const event of events) {
    random -= (event.weight || 1);
    if (random <= 0) {
      return event;
    }
  }

  return events[0]; // fallback
}