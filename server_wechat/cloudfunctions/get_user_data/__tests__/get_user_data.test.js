jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mockCollection } = require('wx-server-sdk');
const getUserData = require('../index').main;

describe('Get User Data Cloud Function', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch user profile and animal data in parallel', async () => {
        // Arrange
        const mockUserProfile = { _id: 'test_openid', gold: 100 };
        const mockAnimalData = [{ _id: 'animal_1', name: '小橘' }];
        
        // Mock the two parallel database calls
        const getFn = _mockCollection.get;
        getFn
            .mockResolvedValueOnce({ data: mockUserProfile, errMsg: 'document.get:ok' })  // For users collection
            .mockResolvedValueOnce({ data: mockAnimalData, errMsg: 'collection.get:ok' }); // For animals collection

        // Act
        const result = await getUserData({}, {});

        // Assert
        const db = cloud.database();
        expect(db.collection).toHaveBeenCalledWith('users');
        expect(db.collection).toHaveBeenCalledWith('animals');
        
        expect(result.code).toBe(200);
        expect(result.data.profile).toEqual(mockUserProfile);
        expect(result.data.animals).toEqual(mockAnimalData);
    });

    test('should return an error if OPENID is not found', async () => {
        // Arrange: Mock the context to have no OPENID
        cloud.getWXContext.mockReturnValueOnce({});

        // Act
        const result = await getUserData({}, {});

        // Assert
        expect(result.code).toBe(401);
        expect(result.message).toContain('Unauthorized');
    });
}); 