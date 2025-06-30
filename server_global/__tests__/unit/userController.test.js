const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');
const User = require('../../models/User');
const { generateToken } = require('../../middleware/auth');

describe('User Controller', () => {
  let mongoServer;
  let testUser;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    
    testUser = new User({
      authProviderId: 'test123',
      authProvider: 'google',
      nickname: 'Test User',
      gold: 1000,
      gems: 100
    });
    await testUser.save();
    
    authToken = generateToken(testUser._id);
  });

  describe('POST /api/users/login', () => {
    it('should create new user on first login', async () => {
      const loginData = {
        authProviderId: 'newuser123',
        authProvider: 'google',
        nickname: 'New User'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(201);
      expect(res.body.data.user.nickname).toBe('New User');
      expect(res.body.data.offlineEarnings.gold).toBe(0);
    });

    it('should login existing user and calculate offline earnings', async () => {
      const loginData = {
        authProviderId: 'test123',
        authProvider: 'google',
        nickname: 'Test User'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.user.nickname).toBe('Test User');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          authProviderId: 'test123'
          // Missing authProvider and nickname
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile with animals', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.profile.nickname).toBe('Test User');
      expect(res.body.data.animals).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(401);
    });
  });

  describe('PUT /api/users/nickname', () => {
    it('should update user nickname', async () => {
      const res = await request(app)
        .put('/api/users/nickname')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nickname: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.nickname).toBe('Updated Name');
    });

    it('should return 400 for invalid nickname', async () => {
      const res = await request(app)
        .put('/api/users/nickname')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nickname: '' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
    });

    it('should return 400 for nickname too long', async () => {
      const res = await request(app)
        .put('/api/users/nickname')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nickname: 'This nickname is way too long for our system' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
    });
  });

  describe('PUT /api/users/settings', () => {
    it('should update user settings', async () => {
      const newSettings = {
        music: 0.5,
        sound: 0.8,
        language: 'zh'
      };

      const res = await request(app)
        .put('/api/users/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settings: newSettings });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.settings.music).toBe(0.5);
      expect(res.body.data.settings.language).toBe('zh');
    });

    it('should return 400 for invalid settings object', async () => {
      const res = await request(app)
        .put('/api/users/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settings: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
    });
  });

  describe('GET /api/users/transactions', () => {
    it('should return user transaction history', async () => {
      const res = await request(app)
        .get('/api/users/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.transactions).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/users/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.current).toBe('1');
    });
  });
});