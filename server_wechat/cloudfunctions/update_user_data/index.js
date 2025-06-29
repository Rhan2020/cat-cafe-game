const cloud = require('wx-server-sdk');

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    if (!openid) {
        return {
            code: 401,
            message: 'User not authenticated.',
        };
    }

    const { gold } = event;

    // --- Validation ---
    if (typeof gold !== 'number' || gold < 0 || !isFinite(gold)) {
        return {
            code: 400,
            message: 'Invalid gold amount. Must be a non-negative number.',
        };
    }

    try {
        const result = await db.collection('users').where({
            _openid: openid
        }).update({
            data: {
                gold: _.set(Math.floor(gold)), // Use _.set for targeted update and floor to ensure integer
                last_update_time: new Date()
            }
        });

        if (result.stats.updated === 0) {
            return {
                code: 404,
                message: 'User not found.',
            };
        }

        return {
            code: 200,
            message: 'User data updated successfully.',
            data: {
                updated: result.stats.updated
            }
        };

    } catch (err) {
        console.error('Error updating user data:', err);
        return {
            code: 500,
            message: 'Internal server error.',
            error: err
        };
    }
}; 