import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';
import { hashPassword } from '../services/authService.js';

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            characters: true,
            campaigns: true,
            collections: true
          }
        }
      }
    });

    res.json({ user });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Update user profile
router.put('/me', authenticate, uploadSingle('avatar'), handleUploadError, async (req, res, next) => {
  try {
    const updateSchema = z.object({
      displayName: z.string().min(1).optional(),
      bio: z.string().optional(),
      password: z.string().min(6).optional()
    });

    const validatedData = updateSchema.parse(req.body);

    const updateData = {};
    if (validatedData.displayName) {
      updateData.displayName = validatedData.displayName;
    }
    if (validatedData.bio !== undefined) {
      updateData.bio = validatedData.bio;
    }
    if (validatedData.password) {
      updateData.passwordHash = await hashPassword(validatedData.password);
    }
    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid input data',
        details: error.errors
      });
    }
    next(error);
  }
});

export default router;

