const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    if (!openid) {
        return {
            code: 401,
            message: 'User not authenticated.',
        };
    }

    // 获取客户端传来的数据（仅用于参考，不直接使用）
    const { gold: clientGold } = event;
    
    try {
        // 1. 获取用户当前数据
        const userResult = await db.collection('users').doc(openid).get();
        if (!userResult.data) {
            return { code: 404, message: 'User not found.' };
        }
        
        const user = userResult.data;
        const now = new Date();
        const lastUpdateTime = user.last_update_time ? new Date(user.last_update_time) : user.last_login_time;
        const secondsSinceLastUpdate = Math.floor((now.getTime() - lastUpdateTime.getTime()) / 1000);
        
        // 2. 服务端重新计算实际收益
        const { TIME, EARNINGS } = require('../../constants/gameConstants');
        let serverCalculatedGold = 0;
        
        if (secondsSinceLastUpdate > 0 && secondsSinceLastUpdate <= TIME.MAX_UPDATE_INTERVAL_SECONDS) {
            // 获取工作中的动物和配置 - 优化查询，只获取需要的配置
            const [animalsResult, breedConfigResult] = await Promise.all([
                db.collection('animals').where({ _openid: openid, status: 'working' }).get(),
                db.collection('game_configs').doc('animal_breeds').get()
            ]);
            
            const workingAnimals = animalsResult.data || [];
            const breedConfigs = breedConfigResult.data && breedConfigResult.data.data ? breedConfigResult.data.data : [];
            
            if (workingAnimals.length > 0 && breedConfigs.length > 0) {
                const breedMap = new Map(breedConfigs.map(b => [b.breedId, b]));
                let totalSpeed = 0;
                
                for (const animal of workingAnimals) {
                    const breed = breedMap.get(animal.breedId);
                    if (breed && breed.baseAttributes && typeof breed.baseAttributes.speed === 'number') {
                        totalSpeed += Math.max(0, breed.baseAttributes.speed);
                    }
                }
                
                // 限制最大收益速度
                const cappedSpeed = Math.min(totalSpeed, EARNINGS.MAX_SPEED_PER_SECOND);
                serverCalculatedGold = Math.floor(cappedSpeed * secondsSinceLastUpdate);
            }
        }
        
        // 3. 验证客户端数据的合理性
        const expectedGold = user.gold + serverCalculatedGold;
        const goldDifference = Math.abs((clientGold || 0) - expectedGold);
        const TOLERANCE = Math.max(EARNINGS.MIN_GOLD_TOLERANCE, expectedGold * EARNINGS.GOLD_TOLERANCE_PERCENT);
        
        if (clientGold && goldDifference > TOLERANCE) {
            logger.warn(`Gold mismatch for user ${openid}: client=${clientGold}, expected=${expectedGold}, using server value`);
        }
        
        // 4. 使用服务端计算的值更新数据库
        const result = await db.collection('users').doc(openid).update({
            data: {
                gold: _.inc(serverCalculatedGold),
                last_update_time: now
            }
        });

        // 5. 获取更新后的用户数据以确保返回准确的金币数量
        const updatedUserResult = await db.collection('users').doc(openid).get();
        const actualNewGold = updatedUserResult.data ? updatedUserResult.data.gold : user.gold + serverCalculatedGold;

        return {
            code: 200,
            message: 'User data updated successfully.',
            data: {
                updated: result.stats.updated,
                goldEarned: serverCalculatedGold,
                newGold: actualNewGold
            }
        };

    } catch (err) {
        logger.error('Error updating user data:', err);
        return {
            code: 500,
            message: 'Internal server error.'
        };
    }
}; 