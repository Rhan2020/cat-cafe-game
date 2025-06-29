const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * Fetches all animal documents owned by the calling user.
 *
 * @returns {Promise<Object>} - A result object containing the list of animals or an error.
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const animalsCollection = db.collection('animals');
    
    // Query for all animals owned by the user
    const animalsResult = await animalsCollection.where({
      ownerId: openid
    }).get();

    console.log(`Fetched ${animalsResult.data.length} animals for user ${openid}.`);

    return {
      code: 200,
      message: 'Animals fetched successfully.',
      data: animalsResult.data
    };

  } catch (err) {
    console.error(`Error in get_animals for user ${openid}:`, err);
    return {
      code: 500,
      message: 'Internal Server Error'
    };
  }
}; 