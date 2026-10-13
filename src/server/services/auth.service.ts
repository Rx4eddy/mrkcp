import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../db.js';
import config from '../config/index.js';
import emailService from './email.service.js';
import { PlatformRegistry } from '../adapters/index.js';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export class AuthService {
  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: UserPayload): string {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );
  }

  verifyJwt(token: string): UserPayload | null {
    try {
      return jwt.verify(token, config.jwtSecret) as UserPayload;
    } catch {
      return null;
    }
  }

  async register(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await this.hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        verificationToken,
      },
    });

    // Seed default reminder preferences for all platforms
    const platforms = PlatformRegistry.getAllAdapters();
    for (const p of platforms) {
      await prisma.reminderPreference.create({
        data: {
          userId: user.id,
          platform: p.platformId,
          enabled: true,
          morningOf: true,
          hoursBefore2: true,
        },
      });
    }

    // Send verification email in background
    emailService.sendVerificationEmail(user.email, user.name, verificationToken).catch((err) => {
      console.error('[AuthService] Failed to send verification email:', err);
    });

    const token = this.generateToken({ id: user.id, email: user.email, name: user.name });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        timezone: user.timezone,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await this.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken({ id: user.id, email: user.email, name: user.name });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        timezone: user.timezone,
      },
      token,
    };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new Error('Invalid or expired verification token.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return { success: true, message: 'Email successfully verified!' };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Do not reveal whether user exists for security
    if (!user) {
      return { success: true, message: 'If an account exists with this email, a reset link was sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    return { success: true, message: 'If an account exists with this email, a reset link was sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired password reset link.');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { success: true, message: 'Password has been reset successfully. You can now log in.' };
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        timezone: true,
        createdAt: true,
        linkedAccounts: {
          select: {
            id: true,
            platform: true,
            handle: true,
            isVerified: true,
            verificationCode: true,
            verifiedAt: true,
            lastSyncedAt: true,
            syncStatus: true,
            syncError: true,
          },
        },
        reminderPreferences: {
          select: {
            id: true,
            platform: true,
            enabled: true,
            morningOf: true,
            hoursBefore2: true,
          },
        },
      },
    });

    if (!user) throw new Error('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; timezone?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.timezone ? { timezone: data.timezone } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        timezone: true,
      },
    });
  }
}

export const authService = new AuthService();
export default authService;
