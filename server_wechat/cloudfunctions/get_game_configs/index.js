const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// Cloud function entry point
exports.main = async (event, context) => {
  try {
    const configsCollection = db.collection('game_configs');
    const allConfigs = await configsCollection.get();

    // Transform the array of config documents into a single key-value object
    const configsMap = allConfigs.data.reduce((acc, doc) => {
        // The document ID (e.g., 'items', 'animal_breeds') becomes the key
        // The 'data' field of the document becomes the value
        acc[doc._id] = doc.data;
        return acc;
    }, {});
    
    console.log('Fetched all game configs successfully.');

    return {
      code: 200,
      message: 'Game configs fetched successfully',
      data: configsMap
    };

  } catch (err) {
    console.error('Error in get_game_configs function:', err);
    return {
      code: 500,
      message: 'Internal server error',
      error: err
    };
  }
};
