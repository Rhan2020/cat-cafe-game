// Manually mock the SDK
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mockCollections, _mockDb } = require('wx-server-sdk');
const userLogin = require('../index').main;

describe('User Login Cloud Function', () => {

    beforeEach(() => {
        // Reset all mocks in the collections and the db command mock before each test
        jest.clearAllMocks();
        for (const collectionName in _mockCollections) {
            const collection = _mockCollections[collectionName];
            for (const method in collection) {
                collection[method].mockClear();
            }
        }
        // Also clear mock return values if they were set per-test
        _mockCollections.users.get.mockResolvedValue({ data: [], errMsg: 'collection.get:ok' });
        _mockCollections.animals.get.mockResolvedValue({ data: [], errMsg: 'collection.get:ok' });
        _mockCollections.game_configs.get.mockResolvedValue({ data: [], errMsg: 'collection.get:ok' });
        _mockDb.command.inc.mockClear();
    });

    afterEach(() => {
        // Restore real timers after each test that uses fake timers
        jest.useRealTimers();
    });

    describe('for a new user', () => {
        test('should create a new user with default values', async () => {
            // Arrange
            _mockCollections.users.get.mockResolvedValue({ data: [], errMsg: 'collection.get:ok' });
            
            // Act
            const result = await userLogin({}, {});

            // Assert
            expect(result.code).toBe(201);
            expect(result.message).toBe('User created successfully');
            expect(_mockCollections.users.add).toHaveBeenCalledTimes(1);
            expect(_mockCollections.users.add).toHaveBeenCalledWith({
                data: expect.objectContaining({ _id: 'test_openid', gold: 1000 })
            });
            expect(result.data.user.gold).toBe(1000);
            expect(result.data.offlineEarnings.gold).toBe(0);
        });
    });

    describe('for an existing user', () => {
        const initialGold = 500;
        const now = new Date('2023-01-01T13:00:00.000Z');
        
        test('should not grant offline earnings for immediate relogin', async () => {
            // Arrange
            jest.useFakeTimers().setSystemTime(now);
            const user = {
                _id: 'test_openid',
                nickname: 'Old Player',
                gold: initialGold,
                lastLoginAt: new Date('2023-01-01T12:59:58.000Z'), // 2 seconds ago
            };
            _mockCollections.users.get.mockResolvedValue({ data: [user], errMsg: 'collection.get:ok' });
            
            // Act
            const result = await userLogin({}, {});

            // Assert
            expect(result.code).toBe(200);
            expect(result.data.offlineEarnings.gold).toBe(0);
            expect(result.data.user.gold).toBe(initialGold); // Gold should not change
            expect(_mockDb.command.inc).toHaveBeenCalledWith(0);
        });

        test('should calculate and grant offline earnings based on animal attributes', async () => {
            // Arrange
            jest.useFakeTimers().setSystemTime(now); // 1:00 PM
            const user = {
                _id: 'test_openid',
                nickname: 'Long-time Away Player',
                gold: initialGold,
                lastLoginAt: new Date('2023-01-01T12:00:00.000Z'), // 1 hour ago
            };
            _mockCollections.users.get.mockResolvedValue({ data: [user], errMsg: 'collection.get:ok' });
            
            // Mock game configs
            const gameConfigs = [{
                _id: 'animal_breeds',
                data: [
                    { breedId: 'cat_fast', name: '闪电橘猫', baseAttributes: { speed: 5 } },
                    { breedId: 'cat_normal', name: '普通白猫', baseAttributes: { speed: 2 } },
                ]
            }];
            _mockCollections.game_configs.get.mockResolvedValue({ data: gameConfigs, errMsg: 'collection.get:ok' });

            // Mock two working animals of different breeds
            const workingAnimals = [
                { _id: 'animal1', ownerId: 'test_openid', status: 'working', breedId: 'cat_fast' },
                { _id: 'animal2', ownerId: 'test_openid', status: 'working', breedId: 'cat_normal' },
                { _id: 'animal3', ownerId: 'test_openid', status: 'idle', breedId: 'cat_normal' }, // This one is idle
            ];
            _mockCollections.animals.get.mockResolvedValue({ data: workingAnimals, errMsg: 'collection.get:ok' });

            // Act
            const result = await userLogin({}, {});

            // Assert
            const expectedOfflineSeconds = 3600; // 1 hour
            const expectedEarnedGold = 3600 * (5 + 2); // 3600s * (speed 5 + speed 2)
            
            expect(result.code).toBe(200);
            
            // Check that game_configs was queried
            expect(_mockCollections.game_configs.get).toHaveBeenCalledTimes(1);

            // Check offline earnings calculation
            expect(result.data.offlineEarnings.duration).toBe(expectedOfflineSeconds);
            expect(result.data.offlineEarnings.animalCount).toBe(workingAnimals.length);
            expect(result.data.offlineEarnings.gold).toBe(expectedEarnedGold);

            // Check database update calls
            // 1. For user's gold
            expect(_mockCollections.users.update).toHaveBeenCalledTimes(1);
            expect(_mockDb.command.inc).toHaveBeenCalledWith(expectedEarnedGold);
            // 2. For animals' EXP
            const expectedExpGain = expectedOfflineSeconds * 0.5;
            expect(_mockCollections.animals.update).toHaveBeenCalledTimes(2); // Only for the 2 working animals
            expect(_mockCollections.animals.doc).toHaveBeenCalledWith('animal1');
            expect(_mockCollections.animals.doc).toHaveBeenCalledWith('animal2');
            expect(_mockCollections.animals.update).toHaveBeenCalledWith({ data: { exp: _mockDb.command.inc(expectedExpGain) } });

            // Check final user gold in response
            expect(result.data.user.gold).toBe(initialGold + expectedEarnedGold);
        });
    });
}); 