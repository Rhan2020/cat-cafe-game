const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// Cloud function entry point
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
      return {
          code: 401,
          message: 'Unauthorized. User OPENID not found.'
      }
  }

  try {
    // Fetch user profile in parallel with animal data
    const userPromise = db.collection('users').doc(openid).get();
    const animalsPromise = db.collection('animals').where({
        ownerId: openid
    }).get();

    const [userResult, animalsResult] = await Promise.all([userPromise, animalsPromise]);

    const fullUserData = {
        profile: userResult.data,
        animals: animalsResult.data
    };

    logger.info(`Fetched full data for user ${openid}.`);

    return {
      code: 200,
      message: 'Full user data fetched successfully',
      data: fullUserData
    };

  } catch (err) {
    logger.error(`Error in get_user_data for user ${openid}:`, err);
    return {
      code: 500,
      message: 'Internal server error',
      error: err
    };
  }
}; 