const getUserData = require('../index').main;
const cloud = require('wx-server-sdk');

const { _mocks, _clearAllMocks } = cloud;
const { collections, queries } = _mocks;

describe('Get User Data Cloud Function', () => {

    beforeEach(() => {
        _clearAllMocks();
    });

    it('should fetch user profile and animal data in parallel', async () => {
        // Arrange
        const mockUserProfile = { _id: 'test-openid', name: 'Test User' };
        const mockAnimalData = [{ _id: 'animal1', name: 'Cat A' }];

        queries.get
            .mockResolvedValueOnce({ data: mockUserProfile })  // For users collection doc
            .mockResolvedValueOnce({ data: mockAnimalData }); // For animals collection

        // Act
        const result = await getUserData({});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data.profile).toEqual(mockUserProfile);
        expect(result.data.animals).toEqual(mockAnimalData);

        // Verify that the correct calls were made
        expect(collections.users.doc).toHaveBeenCalledWith('test-openid');
        expect(collections.animals.where).toHaveBeenCalledWith({ _openid: 'test-openid' });
        expect(queries.get).toHaveBeenCalledTimes(2);
    });

    it('should return an error if OPENID is not found', async () => {
        // Arrange: mock context to not have an OPENID
        cloud.getWXContext.mockReturnValueOnce({});

        // Act
        const result = await getUserData({});

        // Assert
        expect(result.code).toBe(401);
    });
}); 