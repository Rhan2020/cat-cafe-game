const getGameConfigs = require('../index').main;
const cloud = require('wx-server-sdk');

const { _mocks, _clearAllMocks } = cloud;
const { collections, queries } = _mocks;

describe('Get Game Configs Cloud Function', () => {

    beforeEach(() => {
        _clearAllMocks();
    });

    it('should fetch all game configs correctly', async () => {
        const mockConfigData = [
            { _id: 'animal_breeds', data: [{ breedId: 'cat_01' }] },
            { _id: 'level_up_exp', data: [100, 200] }
        ];
        queries.get.mockResolvedValue({ data: mockConfigData });

        const result = await getGameConfigs({});

        expect(result.code).toBe(200);
        expect(result.data).toEqual(mockConfigData); // The function should return the raw array
    });

    it('should return an empty array if no configs are found', async () => {
        queries.get.mockResolvedValue({ data: [] });
        const result = await getGameConfigs({});
        expect(result.code).toBe(200);
        expect(result.data).toEqual([]);
    });

    it('should return 500 on a database query error', async () => {
        const dbError = new Error('DB Error');
        queries.get.mockRejectedValue(dbError);
        const result = await getGameConfigs({});
        expect(result.code).toBe(500);
    });
}); 