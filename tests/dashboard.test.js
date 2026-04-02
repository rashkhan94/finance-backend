const request = require('supertest');
const app = require('../src/app');
const FinancialRecord = require('../src/models/FinancialRecord');

const getAuthToken = async (role = 'admin') => {
  const email = `${role}_dash_${Date.now()}@test.com`;
  await request(app)
    .post('/api/auth/register')
    .send({ name: `${role} User`, email, password: 'password123', role });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });

  return loginRes.body.data.token;
};

describe('Dashboard Endpoints', () => {
  let adminToken;
  let analystToken;
  let viewerToken;

  beforeEach(async () => {
    adminToken = await getAuthToken('admin');
    analystToken = await getAuthToken('analyst');
    viewerToken = await getAuthToken('viewer');

    // seed some records through the API
    const records = [
      { amount: 5000, type: 'income', category: 'salary', date: '2024-01-15' },
      { amount: 2000, type: 'income', category: 'freelance', date: '2024-02-20' },
      { amount: 1200, type: 'expense', category: 'rent', date: '2024-01-10' },
      { amount: 300, type: 'expense', category: 'groceries', date: '2024-02-05' },
      { amount: 150, type: 'expense', category: 'transport', date: '2024-03-01' },
    ];

    for (const rec of records) {
      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rec);
    }
  });

  describe('GET /api/dashboard/summary', () => {
    it('should return financial summary for analyst', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.summary.totalIncome).toBe(7000);
      expect(res.body.data.summary.totalExpenses).toBe(1650);
      expect(res.body.data.summary.netBalance).toBe(5350);
      expect(res.body.data.summary.totalTransactions).toBe(5);
    });

    it('should deny viewer access to dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/dashboard/category-breakdown', () => {
    it('should return category-wise breakdown', async () => {
      const res = await request(app)
        .get('/api/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.breakdown)).toBe(true);
      expect(res.body.data.breakdown.length).toBeGreaterThan(0);

      // check structure of breakdown items
      const salaryItem = res.body.data.breakdown.find((b) => b.category === 'salary');
      expect(salaryItem).toBeDefined();
      expect(salaryItem.income).toBe(5000);
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should return monthly trends', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.trends)).toBe(true);
    });
  });

  describe('GET /api/dashboard/recent-activity', () => {
    it('should return recent records', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-activity?limit=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records.length).toBeLessThanOrEqual(3);
    });
  });
});
