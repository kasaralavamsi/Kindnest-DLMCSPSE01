const request = require('supertest');
const app = require('../app');

describe('Tasks API', () => {
  let token;
  beforeAll(async () => {
    // Login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    token = res.body.token;
  });

  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', description: 'Test Desc' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('task');
  });

  it('should fetch all tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });
});
