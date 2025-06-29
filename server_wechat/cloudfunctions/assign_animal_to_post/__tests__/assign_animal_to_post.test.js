// Manually mock the SDK
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mocks, _clearAllMocks } = cloud;
const { collections, queries, db } = _mocks;
const assignAnimalToPost = require('../index').main;

// This will be the mock transaction object passed to the transaction's callback
const mockTransaction = {
    collection: db.collection, // Use the same mock collection function
    rollback: jest.fn(),
};

describe('Assign Animal to Post Cloud Function (Transaction Logic)', () => {
    const openid = 'test-openid';
    const animalId = 'test-animal-id';
    const postId = 'post-1';

    beforeEach(() => {
        _clearAllMocks();
        // Also clear the transaction-specific mocks
        mockTransaction.rollback.mockClear();
        // Mock the runTransaction implementation
        db.runTransaction.mockImplementation(async (callback) => {
            // The callback is the function we wrote inside runTransaction
            // We execute it with our mock transaction object
            return await callback(mockTransaction);
        });
    });

    it('should successfully assign an animal and unassign the previous one', async () => {
        // Arrange
        const animalsCollectionMock = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue({ stats: { updated: 1 } }),
        };
        db.collection.mockReturnValue(animalsCollectionMock);
        
        // The second update call (assigning the new animal) should succeed
        animalsCollectionMock.update.mockResolvedValueOnce({ stats: { updated: 1 } }); // For un-assignment
        animalsCollectionMock.update.mockResolvedValueOnce({ stats: { updated: 1 } }); // For assignment

        // Act
        const result = await assignAnimalToPost({ animalId, postId });

        // Assert
        expect(result.code).toBe(200);
        expect(result.message).toBe('Animal assigned successfully.');
        expect(db.collection).toHaveBeenCalledWith('animals');

        // Check un-assignment call
        expect(animalsCollectionMock.where).toHaveBeenCalledWith({ _openid: openid, postId: postId });
        
        // Check assignment call
        expect(animalsCollectionMock.where).toHaveBeenCalledWith({ _id: animalId, _openid: openid, status: 'idle' });

        expect(animalsCollectionMock.update).toHaveBeenCalledTimes(2);
        expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should rollback if the animal to assign is not found or not idle', async () => {
        // Arrange
        const animalsCollectionMock = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn(),
        };
        db.collection.mockReturnValue(animalsCollectionMock);
        
        // Simulate the first update (un-assignment) succeeding
        animalsCollectionMock.update.mockResolvedValueOnce({ stats: { updated: 1 } });
        // Simulate the second update (assignment) failing to find a document
        animalsCollectionMock.update.mockResolvedValueOnce({ stats: { updated: 0 } });
        
        // Act
        // The transaction itself will throw an error when rollback is called
        await assignAnimalToPost({ animalId, postId });

        // Assert
        expect(mockTransaction.rollback).toHaveBeenCalledWith('Animal not found, is not idle, or you do not own it.');
    });

    it('should return 500 if the transaction fails for a non-rollback reason', async () => {
        // Arrange
        const dbError = new Error('DB connection failed');
        db.runTransaction.mockRejectedValue(dbError);

        // Act
        const result = await assignAnimalToPost({ animalId, postId });

        // Assert
        expect(result.code).toBe(500);
        expect(result.message).toBe('Internal Server Error');
    });

    it('should return 400 if animalId or postId is missing', async () => {
        const result1 = await assignAnimalToPost({ postId });
        expect(result1.code).toBe(400);

        const result2 = await assignAnimalToPost({ animalId });
        expect(result2.code).toBe(400);
    });
});
