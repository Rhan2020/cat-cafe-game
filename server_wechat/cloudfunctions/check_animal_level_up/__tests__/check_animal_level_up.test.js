// Manually mock the SDK
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mocks, _clearAllMocks } = cloud;
const { collections, queries } = _mocks;
const checkLevelUp = require('../index').main;

describe('Check Animal Level Up Cloud Function (Refactored)', () => {
    const openid = 'test-openid';
    const animalId = 'test-animal-id';

    const mockAnimal = {
        _id: animalId,
        _openid: openid,
        level: 1,
        exp: 0,
    };

    const mockLevelUpConfig = {
        _id: 'animal_level_up_exp',
        data: [100, 200, 300], // exp for lv1->2, lv2->3, lv3->4
    };

    beforeEach(() => {
        _clearAllMocks();
    });

    const setupMocks = (animalData, configData = mockLevelUpConfig) => {
        // Mock the Promise.all calls
        queries.get
            .mockResolvedValueOnce({ data: animalData ? [animalData] : [] }) // Animal query
            .mockResolvedValueOnce({ data: configData });                   // Config query
    };

    it('should not level up if EXP is insufficient', async () => {
        setupMocks({ ...mockAnimal, exp: 50 });
        const result = await checkLevelUp({ animalId });
        expect(result.data.didLevelUp).toBe(false);
        expect(queries.update).not.toHaveBeenCalled();
    });

    it('should level up once and consume exact EXP', async () => {
        setupMocks({ ...mockAnimal, exp: 100 });
        queries.update.mockResolvedValue({ stats: { updated: 1 } });

        const result = await checkLevelUp({ animalId });

        expect(result.data.didLevelUp).toBe(true);
        expect(result.data.newLevel).toBe(2);
        expect(result.data.currentExp).toBe(0);
        expect(collections.animals.doc).toHaveBeenCalledWith(animalId);
        expect(queries.update).toHaveBeenCalledWith({ data: { level: 2, exp: 0 } });
    });

    it('should level up once and keep remaining EXP', async () => {
        setupMocks({ ...mockAnimal, exp: 150 });
        queries.update.mockResolvedValue({ stats: { updated: 1 } });
        
        const result = await checkLevelUp({ animalId });
        
        expect(result.data.didLevelUp).toBe(true);
        expect(result.data.newLevel).toBe(2);
        expect(result.data.currentExp).toBe(50);
        expect(queries.update).toHaveBeenCalledWith({ data: { level: 2, exp: 50 } });
    });

    it('should level up multiple times and keep remaining EXP', async () => {
        // Needs 100 + 200 = 300 EXP to reach level 3
        setupMocks({ ...mockAnimal, exp: 350 });
        queries.update.mockResolvedValue({ stats: { updated: 1 } });

        const result = await checkLevelUp({ animalId });

        expect(result.data.didLevelUp).toBe(true);
        expect(result.data.newLevel).toBe(3);
        expect(result.data.currentExp).toBe(50); // 350 - 100 - 200 = 50
        expect(queries.update).toHaveBeenCalledWith({ data: { level: 3, exp: 50 } });
    });

    it('should return 404 if animal not found', async () => {
        setupMocks(null); // No animal data
        const result = await checkLevelUp({ animalId });
        expect(result.code).toBe(404);
        expect(result.message).toContain('Animal not found');
    });

    it('should return 500 if level up config is missing', async () => {
        setupMocks(mockAnimal, null); // No config data
        const result = await checkLevelUp({ animalId });
        expect(result.code).toBe(500);
        expect(result.message).toContain('configuration not found');
    });
});
