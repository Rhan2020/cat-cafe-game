// Manually mock the SDK
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mocks, _clearAllMocks } = cloud;
const { collections, queries } = _mocks;
const getAnimals = require('../index').main;

describe('Get Animals Cloud Function', () => {
    const openid = 'test-openid';

    beforeEach(() => {
        _clearAllMocks();
    });

    it('should fetch all animals for the current user', async () => {
        // Arrange
        const userAnimals = [
            { _id: 'animal1', _openid: openid, name: 'Cat A' },
            { _id: 'animal2', _openid: openid, name: 'Dog B' },
        ];
        queries.get.mockResolvedValue({ data: userAnimals });

        // Act
        const result = await getAnimals({});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data).toEqual(userAnimals);
        expect(collections.animals.where).toHaveBeenCalledWith({ _openid: openid });
        expect(queries.get).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if the user has no animals', async () => {
        // Arrange
        queries.get.mockResolvedValue({ data: [] });

        // Act
        const result = await getAnimals({});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data).toEqual([]);
    });

    it('should return 500 on a database query error', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        queries.get.mockRejectedValue(dbError);

        // Act
        const result = await getAnimals({});

        // Assert
        expect(result.code).toBe(500);
        expect(result.message).toBe('Internal Server Error');
    });
});
