const request = require('supertest');
const app = require('../index');

describe('Security Tests', () => {
  describe('Rate Limiting', () => {
    it('should block requests after rate limit is exceeded', async () => {
      // res.t('auto.e5bfabe9')
      const promises = [];
      for (let i = 0; i < 101; i++) {
        promises.push(
          request(app)
            .get('/health')
            .expect((res) => {
              // 前100res.t('auto.e4b8aae8')，第101res.t('auto.e4b8aae5')
              if (i < 100) {
                expect(res.status).toBeLessThan(429);
              }
            })
        );
      }
      
      const results = await Promise.allSettled(promises);
      const rejected = results.filter(r => r.status === 'rejected').length;
      
      // res.t('auto.e5ba94e8')
      expect(rejected).toBeGreaterThan(0);
    }, 10000);

    it('should apply stricter rate limit on auth endpoints', async () => {
      // res.t('auto.e6b58be8')
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/users/login')
            .send({
              authProviderId: 'test-provider',
              nickname: 'TestUser'
            })
        );
      }
      
      const results = await Promise.allSettled(promises);
      const lastResult = results[results.length - 1];
      
      // res.t('auto.e69c80e5')（第6res.t('auto.e4b8aae8')）
      expect(lastResult.status).toBe('rejected');
    }, 10000);
  });

  describe('Input Validation', () => {
    it('should reject login with missing authProviderId', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          nickname: 'TestUser'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('res.t('auto.e8be93e5')');
    });

    it('should reject login with invalid nickname', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          authProviderId: 'test-provider',
          nickname: 'a'.repeat(51) // res.t('auto.e8b685e8')50res.t('auto.e5ad97e7')
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('res.t('auto.e8be93e5')');
    });

    it('should reject login with malicious nickname', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          authProviderId: 'test-provider',
          nickname: '<script>alert("xss")</script>'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('res.t('auto.e8be93e5')');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in response', async () => {
      const res = await request(app)
        .get('/health');
      
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-xss-protection']).toBeDefined();
    });

    it('should not expose sensitive information in error responses', async () => {
      const res = await request(app)
        .get('/nonexistent-endpoint');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('res.t('auto.e68ea5e5')');
      expect(res.body).not.toHaveProperty('stack');
      expect(res.body).not.toHaveProperty('error');
    });
  });

  describe('CORS Protection', () => {
    it('should reject requests from unauthorized origins', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://malicious-site.com');
      
      // res.t('auto.e5ba94e8')CORSres.t('auto.e7ad96e7')Access-Control-Allow-Origin头
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should allow requests from authorized origins', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(res.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // res.t('auto.e6a8a1e6')
      const res = await request(app)
        .post('/api/users/login')
        .send({
          authProviderId: 'test-provider-db-error',
          nickname: 'TestUser'
        });
      
      // res.t('auto.e5ba94e8')，res.t('auto.e4b88de6')
      if (res.status === 500) {
        expect(res.body.message).toBe('res.t('auto.e69c8de5')');
        expect(res.body).not.toHaveProperty('stack');
      }
    });
  });
});