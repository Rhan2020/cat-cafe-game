// Manually mock the SDK
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mockCollections } = require('wx-server-sdk');
const getAnimals = require('../index').main;

describe('Get Animals Cloud Function', () => {

    const openid = 'test_openid';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch all animals for the current user', async () => {
        // Arrange
        const userAnimals = [
            { _id: 'animal1', ownerId: openid, name: 'Cat A' },
            { _id: 'animal2', ownerId: openid, name: 'Dog B' },
        ];
        _mockCollections.animals.get.mockResolvedValue({ data: userAnimals });

        // Act
        const result = await getAnimals({}, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data).toEqual(userAnimals);
        expect(_mockCollections.animals.where).toHaveBeenCalledWith({ ownerId: openid });
    });

    test('should return an empty array if the user has no animals', async () => {
        // Arrange
        _mockCollections.animals.get.mockResolvedValue({ data: [] });

        // Act
        const result = await getAnimals({}, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data).toEqual([]);
    });

    test('should return 500 on a database query error', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        _mockCollections.animals.get.mockRejectedValue(dbError);

        // Act
        const result = await getAnimals({}, {});

        // Assert
        expect(result.code).toBe(500);
        expect(result.message).toBe('Internal Server Error');
    });
});
