const request = require('supertest');
const app = require('../index'); // We need to export 'app' from index.js
const db = require('./db');
const User = require('../models/User');
const Animal = require('../models/Animal');

// Connect to a new in-memory database before running any tests.
beforeAll(async () => await db.connect());

// Clear all test data after each test.
afterEach(async () => await db.clearDatabase());

// Remove and close the db and server.
afterAll(async () => await db.closeDatabase());

describe('User Routes', () => {
  describe('POST /api/users/login', () => {
    
    it('should create a new user if one does not exist and return 201', async () => {
      const userData = { authProviderId: 'google-123', nickname: 'New Player' };
      const res = await request(app)
        .post('/api/users/login')
        .send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.data.user).toHaveProperty('authProviderId', 'google-123');
      
      const userInDb = await User.findById(res.body.data.user._id);
      expect(userInDb).not.toBeNull();
      expect(userInDb.nickname).toBe('New Player');
    });

    it('should return an existing user and their offline earnings', async () => {
      // Arrange
      const now = Date.now();
      const oneHourAgo = now - 3600 * 1000;
      
      // 1. Create a user who last logged in an hour ago
      const existingUser = new User({ 
        authProviderId: 'google-456', 
        nickname: 'Old Player',
        lastLoginAt: new Date(oneHourAgo)
      });
      await existingUser.save();

      // 2. Create animals for this user
      await Animal.create([
        { ownerId: existingUser._id, status: 'working', breedId: 'cat_fast' },
        { ownerId: existingUser._id, status: 'working', breedId: 'cat_normal' },
        { ownerId: existingUser._id, status: 'idle', breedId: 'cat_normal' },
      ]);
      
      // 3. Mock the current time to control offline duration
      jest.spyOn(Date, 'now').mockImplementation(() => now);

      // Act: Try to log in as that user
      const userData = { authProviderId: 'google-456', nickname: 'Old Player' };
      const res = await request(app)
        .post('/api/users/login')
        .send(userData);
      
      // Assert
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Login successful');
      
      // Check offline earnings
      const earnings = res.body.data.offlineEarnings;
      expect(earnings.duration).toBeCloseTo(3600);
      expect(earnings.animalCount).toBe(2); // Only counts working animals
      const expectedGold = 3600 * (5 + 2); // 3600s * (speed 5 + speed 2)
      expect(earnings.gold).toBe(expectedGold);

      // Check if animal EXP was updated in the DB
      const animals = await Animal.find({ ownerId: existingUser._id });
      const workingAnimal = animals.find(a => a.status === 'working');
      const idleAnimal = animals.find(a => a.status === 'idle');
      const expectedExp = 3600 * 0.5;
      expect(workingAnimal.exp).toBe(expectedExp);
      expect(idleAnimal.exp).toBe(0); // Idle animal should not gain EXP

      // Restore mock
      jest.restoreAllMocks();
    });

    it('should return 400 if authProviderId is missing', async () => {
        const userData = { nickname: 'Missing ID' };
        const res = await request(app)
          .post('/api/users/login')
          .send(userData);
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('authProviderId and nickname are required.');
    });
  });
}); 