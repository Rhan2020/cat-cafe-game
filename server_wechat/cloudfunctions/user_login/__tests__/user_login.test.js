// Manually mock the SDK
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mocks, _clearAllMocks } = cloud;
const { collections, queries, db } = _mocks;
const userLogin = require('../index').main;

describe('User Login Cloud Function', () => {
    const openid = 'test-openid';

    beforeEach(() => {
        _clearAllMocks();
    });

    describe('for a new user', () => {
        it('should create a new user with default values', async () => {
            queries.get.mockResolvedValueOnce({ data: null });
            collections.users.add.mockResolvedValue({ _id: 'new-user-id' });

            const result = await userLogin({});

            // The code now returns 200 for new user, so test will expect 200
            expect(result.code).toBe(201); 
            expect(result.message).toBe('User created successfully');
        });
    });

    describe('for an existing user', () => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 3600 * 1000);
        
        const mockUser = {
            _id: 'existing-user-id',
            _openid: openid,
            gold: 1000,
            last_login_time: oneHourAgo,
        };

        it('should calculate and grant offline earnings', async () => {
            const workingAnimals = [
                { breedId: 'cat_01', status: 'working' },
                { breedId: 'cat_02', status: 'working' },
            ];
            // This is the CRITICAL fix: The test must provide the exact structure the function expects
            const gameConfigs = [
                {
                    _id: 'animal_breeds',
                    data: [
                        { breedId: 'cat_01', baseAttributes: { speed: 10 } },
                        { breedId: 'cat_02', baseAttributes: { speed: 20 } },
                    ]
                }
            ];
            
            queries.get
                .mockResolvedValueOnce({ data: [mockUser] }) // User query
                .mockResolvedValueOnce({ data: workingAnimals }) // Animal query
                .mockResolvedValueOnce({ data: gameConfigs }); // Config query

            queries.update.mockResolvedValue({ stats: { updated: 1 } });
            
            const result = await userLogin({});
            
            const expectedOfflineSeconds = 3600;
            const expectedEarnedGold = (10 + 20) * expectedOfflineSeconds;

            expect(result.code).toBe(200);
            expect(result.data.offlineEarnings.gold).toBe(expectedEarnedGold);
        });

        it('should not grant offline earnings for immediate relogin', async () => {
             const userJustLoggedIn = { ...mockUser, last_login_time: new Date() };
             queries.get.mockResolvedValueOnce({ data: [userJustLoggedIn] });
             queries.update.mockResolvedValue({ stats: { updated: 1 } });
             
             const result = await userLogin({});
             
             expect(result.code).toBe(200);
             expect(result.data.offlineEarnings.gold).toBe(0);
             expect(db.command.inc).toHaveBeenCalledWith(0);
        });
    });
}); 