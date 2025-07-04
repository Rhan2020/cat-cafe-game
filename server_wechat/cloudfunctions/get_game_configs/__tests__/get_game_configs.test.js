const getGameConfigs = require('../index').main;
const cloud = require('wx-server-sdk');

const { _mocks, _clearAllMocks } = cloud;
const { collections, queries } = _mocks;

describe('Get Game Configs Cloud Function', () => {

    beforeEach(() => {
        _clearAllMocks();
    });

    it('should fetch all game configs correctly', async () => {
        // Arrange
        const mockConfigData = [
            { _id: 'animal_breeds', data: [{ breedId: 'cat_01' }] },
            { _id: 'level_up_exp', data: [100, 200] }
        ];
        queries.get.mockResolvedValue({ data: mockConfigData });

        // Act
        const result = await getGameConfigs({});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data).toEqual(mockConfigData);
        expect(collections.game_configs.get).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no configs are found', async () => {
        // Arrange
        queries.get.mockResolvedValue({ data: [] });

        // Act
        const result = await getGameConfigs({});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data).toEqual([]);
    });

    it('should return 500 on a database query error', async () => {
        // Arrange
        const dbError = new Error('DB Error');
        queries.get.mockRejectedValue(dbError);

        // Act
        const result = await getGameConfigs({});

        // Assert
        expect(result.code).toBe(500);
        expect(result.message).toBe('Internal Server Error');
    });
}); 