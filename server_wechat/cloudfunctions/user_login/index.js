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
      // User exists, update last login time
      const user = userRecord.data[0];
      await usersCollection.doc(openid).update({
        data: {
          lastLoginAt: db.serverDate()
        }
      });
      console.log(`User ${openid} logged in.`);
      return {
        code: 200,
        message: 'Login successful',
        data: user
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
        data: newUser
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
