const request = require('supertest');
const app = require('../index');

describe('Security Tests', () => {
  describe('Rate Limiting', () => {
    it('should block requests after rate limit is exceeded', async () => {
      // 快速发送多个请求
      const promises = [];
      for (let i = 0; i < 101; i++) {
        promises.push(
          request(app)
            .get('/health')
            .expect((res) => {
              // 前100个请求应该成功，第101个应该被限流
              if (i < 100) {
                expect(res.status).toBeLessThan(429);
              }
            })
        );
      }
      
      const results = await Promise.allSettled(promises);
      const rejected = results.filter(r => r.status === 'rejected').length;
      
      // 应该有一些请求被限流
      expect(rejected).toBeGreaterThan(0);
    }, 10000);

    it('should apply stricter rate limit on auth endpoints', async () => {
      // 测试登录端点的严格限流
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
      
      // 最后一个请求应该被限流（第6个请求）
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
      expect(res.body.message).toContain('输入验证失败');
    });

    it('should reject login with invalid nickname', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          authProviderId: 'test-provider',
          nickname: 'a'.repeat(51) // 超过50字符限制
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('输入验证失败');
    });

    it('should reject login with malicious nickname', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          authProviderId: 'test-provider',
          nickname: '<script>alert("xss")</script>'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('输入验证失败');
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
      expect(res.body.message).toBe('接口不存在');
      expect(res.body).not.toHaveProperty('stack');
      expect(res.body).not.toHaveProperty('error');
    });
  });

  describe('CORS Protection', () => {
    it('should reject requests from unauthorized origins', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://malicious-site.com');
      
      // 应该被CORS策略拒绝或者没有Access-Control-Allow-Origin头
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
      // 模拟数据库连接错误的情况
      const res = await request(app)
        .post('/api/users/login')
        .send({
          authProviderId: 'test-provider-db-error',
          nickname: 'TestUser'
        });
      
      // 应该返回通用错误消息，不暴露内部错误
      if (res.status === 500) {
        expect(res.body.message).toBe('服务器内部错误');
        expect(res.body).not.toHaveProperty('stack');
      }
    });
  });
});