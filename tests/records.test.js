const request = require('supertest');
const app = require('../src/app');

// helper to register and login, returns the JWT
const getAuthToken = async (role = 'admin') => {
  const email = `${role}_${Date.now()}@test.com`;
  await request(app)
    .post('/api/auth/register')
    .send({ name: `${role} User`, email, password: 'password123', role });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });

  return loginRes.body.data.token;
};

describe('Financial Records Endpoints', () => {
  let adminToken;
  let viewerToken;

  beforeEach(async () => {
    adminToken = await getAuthToken('admin');
    viewerToken = await getAuthToken('viewer');
  });

  describe('POST /api/records', () => {
    it('should allow admin to create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 5000,
          type: 'income',
          category: 'salary',
          date: '2024-03-01',
          description: 'March salary',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.record.amount).toBe(5000);
      expect(res.body.data.record.type).toBe('income');
    });

    it('should reject record creation by viewer', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          amount: 100,
          type: 'expense',
          category: 'groceries',
        });

      expect(res.statusCode).toBe(403);
    });

    it('should reject invalid record data', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: -50, type: 'invalid' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/records', () => {
    beforeEach(async () => {
      // seed a few records for testing
      const records = [
        { amount: 1000, type: 'income', category: 'salary', date: '2024-01-15' },
        { amount: 200, type: 'expense', category: 'groceries', date: '2024-02-10' },
        { amount: 500, type: 'expense', category: 'rent', date: '2024-03-01' },
      ];

      for (const rec of records) {
        await request(app)
          .post('/api/records')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(rec);
      }
    });

    it('should list all records with pagination', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter records by type', async () => {
      const res = await request(app)
        .get('/api/records?type=expense')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      res.body.data.records.forEach((rec) => {
        expect(rec.type).toBe('expense');
      });
    });

    it('should filter records by category', async () => {
      const res = await request(app)
        .get('/api/records?category=salary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      res.body.data.records.forEach((rec) => {
        expect(rec.category).toBe('salary');
      });
    });

    it('should allow viewer to read records', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/records/:id', () => {
    it('should allow admin to update a record', async () => {
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 300, type: 'expense', category: 'utilities' });

      const recordId = createRes.body.data.record._id;

      const res = await request(app)
        .put(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 350, description: 'Updated utilities bill' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.record.amount).toBe(350);
    });

    it('should reject update by viewer', async () => {
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100, type: 'expense', category: 'transport' });

      const recordId = createRes.body.data.record._id;

      const res = await request(app)
        .put(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ amount: 200 });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/records/:id', () => {
    it('should soft-delete a record (admin)', async () => {
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 50, type: 'expense', category: 'other' });

      const recordId = createRes.body.data.record._id;

      const deleteRes = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toBe(200);

      // record should no longer appear in listing
      const listRes = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);

      const found = listRes.body.data.records.find((r) => r._id === recordId);
      expect(found).toBeUndefined();
    });
  });
});
