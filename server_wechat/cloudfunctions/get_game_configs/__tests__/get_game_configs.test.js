jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mockCollection } = require('wx-server-sdk');
const getGameConfigs = require('../index').main;

describe('Get Game Configs Cloud Function', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch and format all game configs correctly', async () => {
        // Arrange: Mock the config data returned from the database
        const mockConfigData = [
            {
                _id: 'items',
                data: [{ itemId: 'item_001', name: '猫爪饼干' }]
            },
            {
                _id: 'animal_breeds',
                data: [{ breedId: 'cat_001', name: '中华田园猫' }]
            }
        ];
        _mockCollection.get.mockResolvedValue({ data: mockConfigData, errMsg: 'collection.get:ok' });

        // Act
        const result = await getGameConfigs({}, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data).toBeDefined();
        // Check if the output is a map with keys '_id' of the documents
        expect(result.data.items).toEqual([{ itemId: 'item_001', name: '猫爪饼干' }]);
        expect(result.data.animal_breeds).toEqual([{ breedId: 'cat_001', name: '中华田园猫' }]);
        // Ensure the collection 'game_configs' was queried
        expect(cloud.database().collection).toHaveBeenCalledWith('game_configs');
    });

    test('should return an empty object if no configs are found', async () => {
        // Arrange: Mock an empty return from the database
        _mockCollection.get.mockResolvedValue({ data: [], errMsg: 'collection.get:ok' });

        // Act
        const result = await getGameConfigs({}, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data).toEqual({});
    });
}); 