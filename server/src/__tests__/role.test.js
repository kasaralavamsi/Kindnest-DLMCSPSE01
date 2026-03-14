const request = require('supertest');
const app = require('../app');

describe('Role-based Access', () => {
  it('should deny access to admin route for non-admin', async () => {
    const res = await request(app)
      .get('/api/admin')
      .set('Authorization', 'Bearer fakeToken');
    expect(res.statusCode).toBe(403);
  });
});
