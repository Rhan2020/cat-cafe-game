// Manually mock the SDK
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mockCollection } = require('wx-server-sdk'); // Import the granular mock
const userLogin = require('../index').main;

describe('User Login Cloud Function', () => {

    beforeEach(() => {
        // Reset mocks before each test to ensure test isolation
        jest.clearAllMocks();
    });

    test('should create a new user if one does not exist', async () => {
        // Arrange: Directly mock the 'get' method on the imported collection mock
        _mockCollection.get.mockResolvedValue({ data: [], errMsg: 'collection.get:ok' });
        
        // Act
        const result = await userLogin({}, {});

        // Assert
        expect(result.code).toBe(201);
        expect(result.message).toBe('User created successfully');
        expect(_mockCollection.add).toHaveBeenCalledTimes(1);
        expect(_mockCollection.add).toHaveBeenCalledWith({
            data: expect.objectContaining({
                _id: 'test_openid'
            })
        });
    });

    test('should return existing user and update last login time', async () => {
        // Arrange: Directly mock the 'get' method for this specific test
        const existingUser = {
            _id: 'test_openid',
            nickname: 'Old Player',
            gold: 500,
        };
        _mockCollection.get.mockResolvedValue({ data: [existingUser], errMsg: 'collection.get:ok' });
        
        // Act
        const result = await userLogin({}, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.message).toBe('Login successful');
        expect(result.data).toEqual(existingUser);
        expect(_mockCollection.doc).toHaveBeenCalledWith('test_openid');
        expect(_mockCollection.update).toHaveBeenCalledTimes(1);
        expect(_mockCollection.add).not.toHaveBeenCalled();
    });
}); 