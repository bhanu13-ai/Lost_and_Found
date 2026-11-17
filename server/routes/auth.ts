import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dbRepo, sanitizeUser } from '../config/db.ts';
import { requireAuth, signAuthToken, type AuthenticatedRequest } from '../middleware/auth.ts';
import type { UserRole } from '../../src/types/portal.ts';

const router = Router();

const VALID_ROLES: UserRole[] = ['Student', 'Faculty', 'Staff'];

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, studentId, password, confirmPassword, role, department } = req.body as {
      fullName?: string;
      email?: string;
      studentId?: string;
      password?: string;
      confirmPassword?: string;
      role?: UserRole;
      department?: string;
    };

    if (!fullName || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }

    const saiEmailRegex = /^[a-zA-Z0-9._+-]+@(?:[a-zA-Z0-9_-]{4}\.)?saiuniversity\.edu\.in$/i;
    if (!email || !saiEmailRegex.test(email.trim())) {
      res.status(400).json({
        error:
          'Please provide a valid Sai University email (e.g., name@saiuniversity.edu.in or bhanusri.m-29@abcd.saiuniversity.edu.in).',
      });
      return;
    }

    if (!studentId || studentId.trim().length < 3) {
      res.status(400).json({ error: 'Please enter a valid Student, Faculty, or Staff ID.' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const selectedRole: UserRole = role && VALID_ROLES.includes(role) ? role : 'Student';

    const existing = await dbRepo.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this university email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await dbRepo.createUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      studentId: studentId.trim().toUpperCase(),
      passwordHash,
      role: selectedRole,
      department,
    });

    const token = signAuthToken({
      userId: created.id,
      email: created.email,
      role: created.role,
      fullName: created.fullName,
      studentId: created.studentId,
    });

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: sanitizeUser(created),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to complete registration. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
    };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await dbRepo.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signAuthToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
      },
      Boolean(rememberMe)
    );

    res.json({
      message: 'Signed in successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await dbRepo.findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Unable to fetch user profile.' });
  }
});

export default router;
