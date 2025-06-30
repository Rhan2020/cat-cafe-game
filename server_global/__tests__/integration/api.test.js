const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');
const User = require('../../models/User');
const Animal = require('../../models/Animal');
const GameConfig = require('../../models/GameConfig');
const { generateToken } = require('../../middleware/auth');

describe('API Integration Tests', () => {
  let mongoServer;
  let testUser;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup test game configurations
    await setupGameConfigs();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Animal.deleteMany({});
    
    testUser = new User({
      authProviderId: 'test123',
      authProvider: 'google',
      nickname: 'Test User',
      gold: 10000,
      gems: 1000
    });
    await testUser.save();
    
    authToken = generateToken(testUser._id);
  });

  describe('Game Flow Integration', () => {
    it('should complete full game flow: login -> recruit -> assign -> delivery', async () => {
      // Step 1: Login
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          authProviderId: 'integration_test',
          authProvider: 'google',
          nickname: 'Integration Test User'
        });

      expect(loginRes.status).toBe(201);
      const newUserToken = generateToken(loginRes.body.data.user._id);

      // Step 2: Get game configs
      const configsRes = await request(app)
        .get('/api/game/configs');

      expect(configsRes.status).toBe(200);
      expect(configsRes.body.data.animal_breeds).toBeDefined();

      // Step 3: Recruit animal
      const recruitRes = await request(app)
        .post('/api/game/recruit')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          boxType: 'single',
          count: 1,
          currency: 'gold'
        });

      expect(recruitRes.status).toBe(200);
      expect(recruitRes.body.data.recruitedAnimals).toHaveLength(1);
      
      const recruitedAnimal = recruitRes.body.data.recruitedAnimals[0];

      // Step 4: Assign animal to post
      const assignRes = await request(app)
        .put(`/api/animals/${recruitedAnimal._id}/assign`)
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          postId: 'kitchen'
        });

      expect(assignRes.status).toBe(200);

      // Step 5: Start delivery
      const deliveryRes = await request(app)
        .post('/api/game/delivery/start')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          animalId: recruitedAnimal._id
        });

      // This might fail because animal is working, but let's unassign first
      await request(app)
        .put(`/api/animals/${recruitedAnimal._id}/unassign`)
        .set('Authorization', `Bearer ${newUserToken}`);

      const deliveryRes2 = await request(app)
        .post('/api/game/delivery/start')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          animalId: recruitedAnimal._id
        });

      expect(deliveryRes2.status).toBe(200);
      expect(deliveryRes2.body.data.deliveryId).toBeDefined();
    });

    it('should handle daily wheel spinning correctly', async () => {
      // Free spin
      const freeSpinRes = await request(app)
        .post('/api/game/wheel/spin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ spinType: 'free' });

      expect(freeSpinRes.status).toBe(200);
      expect(freeSpinRes.body.data.reward).toBeDefined();

      // Try free spin again (should fail)
      const secondFreeSpinRes = await request(app)
        .post('/api/game/wheel/spin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ spinType: 'free' });

      expect(secondFreeSpinRes.status).toBe(400);

      // Paid spin
      const paidSpinRes = await request(app)
        .post('/api/game/wheel/spin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ spinType: 'paid' });

      expect(paidSpinRes.status).toBe(200);
    });

    it('should handle animal management workflow', async () => {
      // Create test animal
      const testAnimal = new Animal({
        ownerId: testUser._id,
        species: 'cat',
        breedId: 'cat_001',
        name: 'Test Cat',
        level: 1,
        exp: 0,
        attributes: {
          speed: 5,
          luck: 1,
          cooking: 3,
          charm: 2,
          stamina: 10
        }
      });
      await testAnimal.save();

      // Get animals
      const getAnimalsRes = await request(app)
        .get('/api/animals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getAnimalsRes.status).toBe(200);
      expect(getAnimalsRes.body.data).toHaveLength(1);

      // Update animal name
      const updateNameRes = await request(app)
        .put(`/api/animals/${testAnimal._id}/name`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Cat' });

      expect(updateNameRes.status).toBe(200);
      expect(updateNameRes.body.data.name).toBe('Updated Cat');

      // Assign to post
      const assignRes = await request(app)
        .put(`/api/animals/${testAnimal._id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ postId: 'kitchen' });

      expect(assignRes.status).toBe(200);

      // Unassign
      const unassignRes = await request(app)
        .put(`/api/animals/${testAnimal._id}/unassign`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(unassignRes.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      const res = await request(app)
        .get('/api/animals');

      expect(res.status).toBe(401);
    });

    it('should handle invalid animal IDs', async () => {
      const res = await request(app)
        .get('/api/animals/invalid_id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(500); // Mongoose error
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limit
      const promises = Array(25).fill().map(() => 
        request(app)
          .post('/api/game/recruit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            boxType: 'single',
            count: 1,
            currency: 'gold'
          })
      );

      const results = await Promise.all(promises);
      const rateLimitedResponses = results.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent user operations', async () => {
      const users = await Promise.all(
        Array(10).fill().map(async (_, i) => {
          const user = new User({
            authProviderId: `perf_test_${i}`,
            authProvider: 'google',
            nickname: `Perf User ${i}`,
            gold: 10000,
            gems: 1000
          });
          await user.save();
          return { user, token: generateToken(user._id) };
        })
      );

      const operations = users.map(({ token }) => 
        request(app)
          .post('/api/game/recruit')
          .set('Authorization', `Bearer ${token}`)
          .send({
            boxType: 'single',
            count: 1,
            currency: 'gold'
          })
      );

      const results = await Promise.all(operations);
      const successfulOperations = results.filter(res => res.status === 200);
      
      expect(successfulOperations.length).toBe(10);
    });
  });
});

async function setupGameConfigs() {
  const configs = [
    {
      configType: 'animal_breeds',
      version: '1.0.0',
      createdBy: 'system',
      data: [
        {
          breedId: 'cat_001',
          species: 'cat',
          name: 'res.t('auto.e4b8ade5')',
          rarity: 'N',
          description: 'res.t('auto.e69c80e5')',
          baseAttributes: {
            speed: 5,
            luck: 1,
            cooking: 3,
            charm: 2,
            stamina: 10
          },
          skillSlots: 1,
          allowedPosts: ['kitchen', 'counter', 'delivery']
        }
      ]
    },
    {
      configType: 'posts',
      version: '1.0.0',
      createdBy: 'system',
      data: [
        {
          postId: 'kitchen',
          name: 'res.t('auto.e5908ee5')',
          description: 'res.t('auto.e588b6e4')',
          requiredSpecies: ['cat'],
          baseProduction: 10,
          unlockLevel: 1
        }
      ]
    },
    {
      configType: 'wheel_rewards',
      version: '1.0.0',
      createdBy: 'system',
      data: [
        {
          id: 'gold_small',
          name: 'res.t('auto.e5b091e9')',
          type: 'gold',
          amount: 100,
          weight: 30
        }
      ]
    }
  ];

  for (const config of configs) {
    await GameConfig.create(config);
  }
}