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

  // 1. Basic input validation
  if (!animalId || !postId) {
    return {
      code: 400,
      message: 'Missing required parameters: animalId and postId.'
    };
  }

  try {
    const animalsCollection = db.collection('animals');
    
    // 2. Verify ownership of the animal in a single query
    const animalRecord = await animalsCollection.where({
      _id: animalId,
      ownerId: openid
    }).get();

    if (animalRecord.data.length === 0) {
      return {
        code: 403,
        message: 'Forbidden: You do not own this animal or it does not exist.'
      };
    }

    const animalToAssign = animalRecord.data[0];
    
    // If we are trying to assign an already working animal to the same post, do nothing.
    if (animalToAssign.status === 'working' && animalToAssign.assignedPost === postId) {
      return { code: 200, message: 'Animal is already assigned to this post.' };
    }

    // 3. Unassign any animal that currently occupies the target post
    const occupants = await animalsCollection.where({
        ownerId: openid,
        assignedPost: postId,
        _id: _.neq(animalId) // Important: do not unassign the animal we're trying to assign
    }).get();

    if (occupants.data.length > 0) {
        const occupantId = occupants.data[0]._id;
        console.log(`Post ${postId} is occupied by ${occupantId}. Unassigning it.`);
        await animalsCollection.doc(occupantId).update({
            data: {
                status: 'idle',
                assignedPost: '' // or null
            }
        });
    }

    // 4. Update the target animal's status and assigned post
    const updateResult = await animalsCollection.doc(animalId).update({
      data: {
        status: 'working',
        assignedPost: postId
      }
    });
    
    if (updateResult.stats.updated === 1) {
        console.log(`Animal ${animalId} assigned to post ${postId} for user ${openid}.`);
        return {
          code: 200,
          message: 'Animal assigned successfully.'
        };
    } else {
        // This case might happen if the document exists but the update fails for some reason
        return {
            code: 500,
            message: 'Failed to update animal status.'
        }
    }

  } catch (err) {
    console.error(`Error in assign_animal_to_post for user ${openid}:`, err);
    return {
      code: 500,
      message: 'Internal Server Error'
    };
  }
}; 