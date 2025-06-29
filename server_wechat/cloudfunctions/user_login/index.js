const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// Cloud function entry point
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
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
      const newUser = {
        _openid: openid,
        nickname: `游客${Math.floor(Math.random() * 10000)}`,
        gold: 0,
        last_login_time: now,
        creation_time: now,
      };
      await db.collection('users').add({ data: newUser });
      console.log(`New user created: ${openid}`);
      return {
        code: 201,
        message: 'User created successfully',
        data: { user: newUser, offlineEarnings: { gold: 0 } }
      };
    }

    // Case 2: Existing User
    const user = userResult.data;
    const lastLoginTime = new Date(user.last_login_time);
    const offlineSeconds = Math.floor((now.getTime() - lastLoginTime.getTime()) / 1000);

    let earnedGold = 0;
    if (offlineSeconds > 5) { // Only calculate if offline for more than 5 seconds
      const [workingAnimalsRes, configsRes] = await Promise.all([
        db.collection('animals').where({ _openid: openid, status: 'working' }).get(),
        db.collection('game_configs').get()
      ]);
      
      const workingAnimals = workingAnimalsRes.data || [];
      const breedConfigsDoc = configsRes.data.find(doc => doc._id === 'animal_breeds');
      const breedConfigs = breedConfigsDoc ? breedConfigsDoc.data : [];

      if (workingAnimals.length > 0 && breedConfigs.length > 0) {
        const breedMap = new Map(breedConfigs.map(b => [b.breedId, b]));
        const totalSpeed = workingAnimals.reduce((speed, animal) => {
          const breed = breedMap.get(animal.breedId);
          return speed + (breed?.baseAttributes?.speed || 0);
        }, 0);
        earnedGold = Math.floor(totalSpeed * offlineSeconds);
      }
    }

    // Always update last_login_time, and increment gold only if it's earned
    await db.collection('users').doc(user._id).update({
        data: {
            gold: _.inc(earnedGold),
            last_login_time: now
        }
    });
    
    console.log(`User ${openid} logged in. Earned ${earnedGold} gold.`);
    
    return {
      code: 200,
      message: 'Login successful',
      data: {
        user: { ...user, gold: user.gold + earnedGold },
        offlineEarnings: { gold: earnedGold, duration: offlineSeconds }
      }
    };

  } catch (err) {
    console.error(`Error in user_login for ${openid}:`, err);
    return { code: 500, message: 'Internal Server Error' };
  }
};
