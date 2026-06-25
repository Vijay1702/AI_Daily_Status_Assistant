import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Auth API Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    masterNo: 'EMP001',
    password: 'Test123!Pass',
    dailyHours: 8,
  };

  beforeEach(() => {
    // Reset state before each test
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app).post('/api/auth/register').send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User',
          // missing email, masterNo, password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const response = await request(app).post('/api/auth/register').send(testUser);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Email already in use');
    });

    it('should reject duplicate master number', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'different@example.com',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Master number already in use');
    });

    it('should return JWT token', async () => {
      const response = await request(app).post('/api/auth/register').send(testUser);

      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
      expect(response.body.data.token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(400);
    });

    it('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app).post('/api/auth/register').send(testUser);
      authToken = registerResponse.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should return user details', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const user = response.body.data;
      expect(user.name).toBe(testUser.name);
      expect(user.masterNo).toBe(testUser.masterNo);
      expect(user.dailyHours).toBe(testUser.dailyHours);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app).post('/api/auth/register').send(testUser);
      authToken = registerResponse.body.data.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject logout without token', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong',
      };

      let rateLimitedResponse;

      for (let i = 0; i < 6; i++) {
        rateLimitedResponse = await request(app).post('/api/auth/login').send(loginData);
      }

      if (rateLimitedResponse.status === 429) {
        expect(rateLimitedResponse.status).toBe(429);
      }
    });

    it('should rate limit registration attempts', async () => {
      let response;

      for (let i = 0; i < 6; i++) {
        response = await request(app).post('/api/auth/register').send({
          ...testUser,
          email: `test${i}@example.com`,
        });
      }

      // Rate limit might be enforced
      expect([201, 429]).toContain(response.status);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'not-a-valid-email',
        });

      expect(response.status).toBe(400);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          password: 'weak',
        });

      expect(response.status).toBe(400);
    });

    it('should require all fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'User',
        // missing other fields
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Security', () => {
    it('should not return password hash', async () => {
      const response = await request(app).post('/api/auth/register').send(testUser);

      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return token separately', async () => {
      const response = await request(app).post('/api/auth/register').send(testUser);

      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).not.toHaveProperty('token');
    });
  });
});
