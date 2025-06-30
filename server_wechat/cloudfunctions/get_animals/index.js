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

  if (!openid) {
    return { code: 401, message: 'Unauthorized: OPENID not found.' };
  }

  try {
    const result = await db.collection('animals').where({
      _openid: openid
    }).get();

    logger.info(`Fetched ${result.data.length} animals for user ${openid}.`);
    return {
      code: 200,
      data: result.data
    };

  } catch (err) {
    logger.error(`Error in get_animals for user ${openid}:`, err);
    return {
      code: 500,
      message: 'Internal Server Error'
    };
  }
}; 