const updateUserData = require('../index').main;
const cloud = require('wx-server-sdk');

const { _mocks, _clearAllMocks } = cloud;
const { collections, queries, db } = _mocks;

describe('update_user_data', () => {
    const openid = 'test-openid';

    beforeEach(() => {
        _clearAllMocks();
    });

    it('should update user gold successfully with a valid amount', async () => {
        // Arrange
        queries.update.mockResolvedValue({ stats: { updated: 1 } });
        const event = { gold: 1234.56 };
        
        // Act
        const result = await updateUserData(event, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data.updated).toBe(1);
        expect(collections.users.where).toHaveBeenCalledWith({ _openid: openid });
        expect(queries.update).toHaveBeenCalledWith({
            data: {
                gold: 1234, // Should be floored
                last_update_time: expect.any(Date),
            }
        });
    });

    it('should return 400 for a negative gold amount', async () => {
        const result = await updateUserData({ gold: -100 }, {});
        expect(result.code).toBe(400);
        expect(queries.update).not.toHaveBeenCalled();
    });

    it('should return 400 for a non-numeric gold amount', async () => {
        const event = { gold: "one hundred" };
        const result = await updateUserData(event, {});
        expect(result.code).toBe(400);
        expect(result.message).toContain('Invalid gold amount');
        expect(queries.update).not.toHaveBeenCalled();
    });
    
    it('should return 404 if no user was found to update', async () => {
        // Arrange
        queries.update.mockResolvedValue({ stats: { updated: 0 } });
        
        // Act
        const result = await updateUserData({ gold: 500 }, {});
        
        // Assert
        expect(result.code).toBe(404);
        expect(result.message).toBe('User not found.');
    });

    it('should return 500 on database error', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        queries.update.mockRejectedValue(dbError);

        // Act
        const result = await updateUserData({ gold: 500 }, {});

        // Assert
        expect(result.code).toBe(500);
        expect(result.message).toBe('Internal server error.');
        expect(result.error).toBe(dbError);
    });
}); 