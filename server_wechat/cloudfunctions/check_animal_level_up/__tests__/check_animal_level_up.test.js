// Manually mock the SDK
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mockCollections } = require('wx-server-sdk');
const checkLevelUp = require('../index').main;

describe('Check Animal Level Up Cloud Function', () => {
    
    const animalId = 'animal_123';
    const openid = 'test_openid';
    // Mock EXP requirements: lv1->2: 100, lv2->3: 250, lv3->4: 500
    const levelUpExpConfig = { _id: 'level_up_exp', data: [100, 250, 500] };

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        _mockCollections.game_configs.get.mockResolvedValue({ data: [levelUpExpConfig] });
    });

    test('should not level up if EXP is insufficient', async () => {
        // Arrange
        const animal = { _id: animalId, ownerId: openid, level: 1, exp: 99 };
        _mockCollections.animals.get.mockResolvedValue({ data: [animal] });

        // Act
        const result = await checkLevelUp({ animalId }, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data.didLevelUp).toBe(false);
        expect(_mockCollections.animals.update).not.toHaveBeenCalled();
    });

    test('should level up once if EXP is just enough', async () => {
        // Arrange
        const animal = { _id: animalId, ownerId: openid, level: 1, exp: 100 };
        _mockCollections.animals.get.mockResolvedValue({ data: [animal] });

        // Act
        const result = await checkLevelUp({ animalId }, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data.didLevelUp).toBe(true);
        expect(result.data.newLevel).toBe(2);
        expect(_mockCollections.animals.update).toHaveBeenCalledWith({
            data: { level: 2, exp: 0 }
        });
    });

    test('should level up once and keep remaining EXP', async () => {
        // Arrange
        const animal = { _id: animalId, ownerId: openid, level: 1, exp: 150 };
        _mockCollections.animals.get.mockResolvedValue({ data: [animal] });

        // Act
        const result = await checkLevelUp({ animalId }, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data.didLevelUp).toBe(true);
        expect(result.data.newLevel).toBe(2);
        expect(_mockCollections.animals.update).toHaveBeenCalledWith({
            data: { level: 2, exp: 50 }
        });
    });

    test('should level up multiple times if EXP is very high', async () => {
        // Arrange
        // Total EXP needed for lv1->3 is 100 + 250 = 350. Current EXP is 400.
        const animal = { _id: animalId, ownerId: openid, level: 1, exp: 400 };
        _mockCollections.animals.get.mockResolvedValue({ data: [animal] });

        // Act
        const result = await checkLevelUp({ animalId }, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.data.didLevelUp).toBe(true);
        expect(result.data.newLevel).toBe(3);
        expect(_mockCollections.animals.update).toHaveBeenCalledWith({
            data: { level: 3, exp: 50 } // 400 - 100 - 250 = 50
        });
    });

    test('should return 403 if trying to level up an unowned animal', async () => {
        // Arrange
        _mockCollections.animals.get.mockResolvedValue({ data: [] });
        // Act
        const result = await checkLevelUp({ animalId }, {});
        // Assert
        expect(result.code).toBe(403);
    });
});
