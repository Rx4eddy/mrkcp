import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../src/server/db.js';
import authService from '../src/server/services/auth.service.js';

describe('Authentication and Accounts', () => {
  const testEmail = `auth_test_${Date.now()}@mrkcp.dev`;
  const testPassword = 'Secr3tPassword!23';
  let createdUserId: string;

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
  });

  it('registers a new user and sets default reminder preferences', async () => {
    const res = await authService.register(testEmail, testPassword, 'Tourist');

    expect(res.user).toBeDefined();
    expect(res.user.email).toBe(testEmail);
    expect(res.user.name).toBe('Tourist');
    expect(res.token).toBeDefined();
    createdUserId = res.user.id;

    // Verify reminder preferences were auto-initialized
    const prefs = await prisma.reminderPreference.findMany({
      where: { userId: res.user.id },
    });
    expect(prefs.length).toBeGreaterThanOrEqual(3);
  });

  it('prevents registration with duplicate email', async () => {
    await expect(
      authService.register(testEmail, 'anotherpass', 'Duplicate User')
    ).rejects.toThrow(/already exists/);
  });

  it('successfully logs in with correct password and rejects invalid password', async () => {
    const loginSuccess = await authService.login(testEmail, testPassword);
    expect(loginSuccess.user.id).toBe(createdUserId);
    expect(loginSuccess.token).toBeDefined();

    await expect(
      authService.login(testEmail, 'wrong-password')
    ).rejects.toThrow(/Invalid email or password/);
  });

  it('signs and verifies JWT payloads accurately', () => {
    const payload = { id: 'usr-1', email: 'test@mrkcp.dev', name: 'Tester' };
    const token = authService.generateToken(payload);
    expect(typeof token).toBe('string');

    const decoded = authService.verifyJwt(token);
    expect(decoded).toBeDefined();
    expect(decoded?.id).toBe('usr-1');
    expect(decoded?.email).toBe('test@mrkcp.dev');
  });
});
