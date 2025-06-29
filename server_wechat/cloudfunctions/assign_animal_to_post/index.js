const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * Assigns a specific animal to a work post.
 *
 * @param {Object} event - The event object.
 * @param {string} event.animalId - The ID of the animal to assign.
 * @param {string} event.postId - The ID of the post to assign to.
 * @returns {Promise<Object>} - A result object with success or error code and message.
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { animalId, postId } = event;

  if (!animalId || !postId) {
    return { code: 400, message: 'animalId and postId are required.' };
  }

  try {
    const result = await db.runTransaction(async transaction => {
      const animalsCollection = transaction.collection('animals');

      // Step 1: Unassign any animal currently at the target post
      // This is a "fire-and-forget" update, we don't care if 0 or 1 animals were updated.
      await animalsCollection.where({
        _openid: openid,
        postId: postId,
      }).update({
        data: {
          status: 'idle',
          postId: '',
        }
      });
      
      // Step 2: Try to assign the new animal to the post.
      // The where clause is critical: it ensures we only assign an animal that is
      // currently idle and owned by the user.
      const assignResult = await animalsCollection.where({
        _id: animalId,
        _openid: openid,
        status: 'idle',
      }).update({
        data: {
          status: 'working',
          postId: postId,
        }
      });

      // Step 3: Check if the assignment was successful.
      // If the where clause in Step 2 didn't find a matching animal (e.g., it was
      // already working, or didn't exist), assignResult.stats.updated will be 0.
      if (assignResult.stats.updated === 0) {
        // We must abort the transaction. This will automatically roll back the
        // un-assignment from Step 1 if it happened.
        await transaction.rollback('Animal not found, is not idle, or you do not own it.');
      }
    });

    // If the transaction is successful
    return { code: 200, message: 'Animal assigned successfully.' };

  } catch (e) {
    // This catches both transaction logic errors (like the rollback) and real DB errors
    if (e.errMsg && e.errMsg.includes('aborted')) {
        return { code: 404, message: 'Animal not found, is not idle, or you do not own it.' };
    }
    
    console.error("Transaction failed:", e);
    return { code: 500, message: 'Internal Server Error' };
  }
}; 