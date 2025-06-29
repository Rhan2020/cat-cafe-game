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

  try {
    const usersCollection = db.collection('users');
    const userRecord = await usersCollection.where({
      _id: openid
    }).get();

    if (userRecord.data.length > 0) {
      // User exists, calculate offline earnings and update last login time
      const user = userRecord.data[0];
      const lastLoginDate = user.lastLoginAt;
      const now = new Date();
      const offlineSeconds = Math.floor((now - lastLoginDate) / 1000);

      let earnedGold = 0;
      let workingAnimalsCount = 0;

      // Calculate offline earnings only if offline for a meaningful duration
      if (offlineSeconds > 5) { // At least 5 seconds to avoid negligible calculations
        // 1. Get all game configurations in one go
        const configs = await db.collection('game_configs').get();
        const animalBreedsConfig = configs.data.find(c => c._id === 'animal_breeds')?.data || [];

        // 2. Get user's working animals
        const animalsCollection = db.collection('animals');
        const workingAnimals = await animalsCollection.where({
          ownerId: openid,
          status: 'working'
        }).get();
        
        workingAnimalsCount = workingAnimals.data.length;

        if (workingAnimalsCount > 0) {
          const expPerSecond = 0.5; // Placeholder: EXP gain rate

          // 3. Calculate earnings and EXP for each animal
          let totalEarnedGold = 0;
          const animalUpdatePromises = [];

          for (const animal of workingAnimals.data) {
            // Calculate gold
            const breedInfo = animalBreedsConfig.find(b => b.breedId === animal.breedId);
            const goldPerSecond = breedInfo?.baseAttributes?.speed || 1;
            totalEarnedGold += (offlineSeconds * goldPerSecond);

            // Calculate EXP and prepare update
            const earnedExp = offlineSeconds * expPerSecond;
            if (earnedExp > 0) {
              const promise = db.collection('animals').doc(animal._id).update({
                data: { exp: _.inc(earnedExp) }
              });
              animalUpdatePromises.push(promise);
            }
          }
          
          earnedGold = Math.floor(totalEarnedGold);

          // We don't await the animal updates to speed up login response.
          // The client can refetch animal data later if needed.
          // This logs potential errors on the server side.
          Promise.all(animalUpdatePromises).catch(err => {
              console.error(`Failed to update EXP for some animals for user ${openid}:`, err);
          });
        }
      }

      // Update user's last login time and add earned gold
      await usersCollection.doc(openid).update({
        data: {
          lastLoginAt: db.serverDate(),
          gold: _.inc(earnedGold)
        }
      });

      console.log(`User ${openid} logged in. Earned ${earnedGold} gold after ${offlineSeconds}s offline with ${workingAnimalsCount} animals.`);
      
      // Prepare the response payload
      const updatedUser = {
          ...user,
          gold: user.gold + earnedGold,
          lastLoginAt: now // Use the 'now' from the start of the function for consistency
      };

      return {
        code: 200,
        message: 'Login successful',
        data: {
          user: updatedUser,
          offlineEarnings: {
            gold: earnedGold,
            duration: offlineSeconds,
            animalCount: workingAnimalsCount
          }
        }
      };
    } else {
      // User does not exist, create a new user
      const newUser = {
        _id: openid,
        createdAt: db.serverDate(),
        lastLoginAt: db.serverDate(),
        nickname: `主人_${openid.substring(openid.length - 4)}`, // Default nickname
        avatarUrl: '', // Client should upload this
        gold: 1000,
        gems: 10,
        inventory: {},
        settings: {
            music: 1,
            sound: 1
        },
        debut: { // Default debut scenario
            type: 'N',
            debt: 5000 
        }
      };
      await usersCollection.add({
        data: newUser
      });
      console.log(`New user ${openid} created.`);
      return {
        code: 201,
        message: 'User created successfully',
        // New user has no offline earnings, so the structure is simpler
        data: {
          user: newUser,
          offlineEarnings: {
            gold: 0,
            duration: 0,
            animalCount: 0
          }
        }
      };
    }
  } catch (err) {
    console.error('Error in user_login function:', err);
    return {
      code: 500,
      message: 'Internal server error',
      error: err
    };
  }
};
