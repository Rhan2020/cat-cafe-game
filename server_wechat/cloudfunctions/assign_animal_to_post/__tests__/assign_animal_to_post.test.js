// Manually mock the SDK
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');
const { _mockCollections } = require('wx-server-sdk');
const assignAnimalToPost = require('../index').main;

describe('Assign Animal to Post Cloud Function', () => {
    
    const animalId = 'animal_123';
    const postId = 'post_kitchen';
    const openid = 'test_openid'; // From mock

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully assign an owned animal to a post', async () => {
        // Arrange
        const animal = { _id: animalId, ownerId: openid, status: 'idle' };
        _mockCollections.animals.get.mockResolvedValue({ data: [animal] });
        _mockCollections.animals.update.mockResolvedValue({ stats: { updated: 1 } });
        
        // Act
        const result = await assignAnimalToPost({ animalId, postId }, {});

        // Assert
        expect(result.code).toBe(200);
        expect(result.message).toBe('Animal assigned successfully.');
        expect(_mockCollections.animals.where).toHaveBeenCalledWith({ _id: animalId, ownerId: openid });
        expect(_mockCollections.animals.doc).toHaveBeenCalledWith(animalId);
        expect(_mockCollections.animals.update).toHaveBeenCalledWith({
            data: { status: 'working', assignedPost: postId }
        });
    });

    test('should return 400 if animalId or postId is missing', async () => {
        // Act & Assert
        const result1 = await assignAnimalToPost({ postId }, {});
        expect(result1.code).toBe(400);

        const result2 = await assignAnimalToPost({ animalId }, {});
        expect(result2.code).toBe(400);

        expect(_mockCollections.animals.where).not.toHaveBeenCalled();
    });

    test('should return 403 if the animal is not owned by the user', async () => {
        // Arrange
        _mockCollections.animals.get.mockResolvedValue({ data: [] });

        // Act
        const result = await assignAnimalToPost({ animalId, postId }, {});

        // Assert
        expect(result.code).toBe(403);
        expect(result.message).toContain('You do not own this animal');
        expect(_mockCollections.animals.update).not.toHaveBeenCalled();
    });
    
    test('should return 500 if the database update fails', async () => {
        // Arrange
        const animal = { _id: animalId, ownerId: openid, status: 'idle' };
        _mockCollections.animals.get.mockResolvedValue({ data: [animal] });
        _mockCollections.animals.update.mockResolvedValue({ stats: { updated: 0 } }); // Simulate a failed update

        // Act
        const result = await assignAnimalToPost({ animalId, postId }, {});

        // Assert
        expect(result.code).toBe(500);
        expect(result.message).toBe('Failed to update animal status.');
    });

    test('should return 500 on a database query error', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        _mockCollections.animals.get.mockRejectedValue(dbError);

        // Act
        const result = await assignAnimalToPost({ animalId, postId }, {});

        // Assert
        expect(result.code).toBe(500);
        expect(result.message).toBe('Internal Server Error');
    });

    test('should unassign the previous occupant when assigning an animal to an occupied post', async () => {
        // Arrange
        const newAnimalId = 'animal_new';
        const occupantAnimalId = 'animal_occupant';
        const animalToAssign = { _id: newAnimalId, ownerId: openid, status: 'idle' };
        const occupantAnimal = { _id: occupantAnimalId, ownerId: openid, status: 'working', assignedPost: postId };
        
        // The first .get() call checks for ownership of the new animal
        // The second .get() call checks for an existing occupant
        _mockCollections.animals.get
            .mockResolvedValueOnce({ data: [animalToAssign] })
            .mockResolvedValueOnce({ data: [occupantAnimal] });

        _mockCollections.animals.update.mockResolvedValue({ stats: { updated: 1 } });

        // Act
        const result = await assignAnimalToPost({ animalId: newAnimalId, postId }, {});
        
        // Assert
        expect(result.code).toBe(200);
        
        // Check that update was called twice
        expect(_mockCollections.animals.update).toHaveBeenCalledTimes(2);

        // Check that the occupant was unassigned
        expect(_mockCollections.animals.doc).toHaveBeenCalledWith(occupantAnimalId);
        expect(_mockCollections.animals.update).toHaveBeenCalledWith({
            data: { status: 'idle', assignedPost: '' }
        });

        // Check that the new animal was assigned
        expect(_mockCollections.animals.doc).toHaveBeenCalledWith(newAnimalId);
        expect(_mockCollections.animals.update).toHaveBeenCalledWith({
            data: { status: 'working', assignedPost: postId }
        });
    });
});
