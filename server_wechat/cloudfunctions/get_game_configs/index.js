const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// Cloud function entry point
exports.main = async (event, context) => {
  try {
    const result = await db.collection('game_configs').get();

    // The result object from get() contains a 'data' property which is the array of documents.
    // The test expects this entire array to be returned.
    return {
      code: 200,
      message: 'Configs fetched successfully.',
      data: result.data
    };
  } catch (err) {
    logger.error('Error in get_game_configs function:', err);
    return {
      code: 500,
      message: 'Internal server error',
      error: err
    };
  }
};
