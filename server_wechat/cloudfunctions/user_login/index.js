const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 输入验证函数
const validateInput = (event) => {
  // 检查event是否为对象
  if (!event || typeof event !== 'object') {
    return { valid: false, error: '无效的请求参数' };
  }
  
  // 如果有nickname参数，进行验证
  if (event.nickname !== undefined) {
    if (typeof event.nickname !== 'string' || 
        event.nickname.length > 50 || 
        event.nickname.length < 1) {
      return { valid: false, error: '昵称必须是1-50个字符的字符串' };
    }
  }
  
  return { valid: true };
};

// Cloud function entry point
exports.main = async (event, context) => {
  // 输入验证
  const validation = validateInput(event);
  if (!validation.valid) {
    logger.error('输入验证失败:', validation.error);
    return { 
      code: 400, 
      message: validation.error 
    };
  }
  
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  // 检查openid是否存在
  if (!openid) {
    logger.error('未获取到用户openid');
    return { 
      code: 401, 
      message: '用户身份验证失败' 
    };
  }
  
  const now = new Date();

  try {
    let userResult;
    try {
      userResult = await db.collection('users').doc(openid).get();
    } catch (e) {
      // User not found is a normal case for new users, not an error
      if (e.errCode === -1) { 
        userResult = { data: null };
      } else {
        throw e; // Re-throw other errors
      }
    }

    // Case 1: New User
    if (userResult.data === null) {
      // 生成安全的默认昵称
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const newUser = {
        _openid: openid,
        nickname: event.nickname || `游客${randomSuffix}`,
        gold: 1000, // 给新用户一些初始金币
        gems: 100, // 给新用户一些初始钻石
        last_login_time: now,
        creation_time: now,
        inventory: {},
        settings: { music: 1, sound: 1 },
        debut: { type: 'N', debt: 5000 }
      };
      
      try {
        await db.collection('users').add({ data: newUser });
        logger.info(`新用户创建成功: ${openid}`);
        return {
          code: 201,
          message: '用户创建成功',
          data: { 
            user: newUser, 
            offlineEarnings: { gold: 0, duration: 0 } 
          }
        };
      } catch (addError) {
        logger.error(`创建新用户失败: ${openid}`, addError);
        return { 
          code: 500, 
          message: '用户创建失败' 
        };
      }
    }

    // Case 2: Existing User
    const user = userResult.data;
    const lastLoginTime = new Date(user.last_login_time);
    const offlineSeconds = Math.floor((now.getTime() - lastLoginTime.getTime()) / 1000);

          let earnedGold = 0;
      const MAX_OFFLINE_HOURS = 24; // 最大24小时离线收益
      const MAX_OFFLINE_SECONDS = MAX_OFFLINE_HOURS * 3600;
      
      if (offlineSeconds > 5) { // Only calculate if offline for more than 5 seconds
        // 限制离线时间上限
        const cappedOfflineSeconds = Math.min(offlineSeconds, MAX_OFFLINE_SECONDS);
        
        const [workingAnimalsRes, configsRes] = await Promise.all([
          db.collection('animals').where({ _openid: openid, status: 'working' }).get(),
          db.collection('game_configs').get()
        ]);
        
        const workingAnimals = workingAnimalsRes.data || [];
        const breedConfigsDoc = configsRes.data.find(doc => doc._id === 'animal_breeds');
        const breedConfigs = breedConfigsDoc ? breedConfigsDoc.data : [];

        if (workingAnimals.length > 0 && breedConfigs.length > 0) {
          const breedMap = new Map(breedConfigs.map(b => [b.breedId, b]));
          let totalSpeed = 0;
          
          // 验证每个动物的有效性
          for (const animal of workingAnimals) {
            const breed = breedMap.get(animal.breedId);
            if (breed && breed.baseAttributes && typeof breed.baseAttributes.speed === 'number') {
              totalSpeed += Math.max(0, breed.baseAttributes.speed); // 确保速度非负
            }
          }
          
          // 计算收益，增加合理性检查
          const baseEarnings = totalSpeed * cappedOfflineSeconds;
          const MAX_EARNINGS_PER_SESSION = 1000000; // 单次最大收益100万金币
          earnedGold = Math.floor(Math.min(baseEarnings, MAX_EARNINGS_PER_SESSION));
        }
      }

    // Always update last_login_time, and increment gold only if it's earned
    await db.collection('users').doc(user._id).update({
        data: {
            gold: _.inc(earnedGold),
            last_login_time: now
        }
    });
    
    logger.info(`User ${openid} logged in. Earned ${earnedGold} gold.`);
    
    return {
      code: 200,
      message: 'Login successful',
      data: {
        user: { ...user, gold: user.gold + earnedGold },
        offlineEarnings: { gold: earnedGold, duration: offlineSeconds }
      }
    };

  } catch (err) {
    logger.error(`用户登录过程中发生错误 ${openid}:`, {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    return { 
      code: 500, 
      message: '服务器内部错误' 
    };
  }
};
