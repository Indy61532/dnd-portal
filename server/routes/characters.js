import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';
import path from 'path';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schema
const characterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z.number().int().min(1).max(20).default(1),
  race: z.string().optional(),
  class: z.string().optional(),
  subclass: z.string().optional(),
  background: z.string().optional(),
  strength: z.number().int().min(1).max(30).default(10),
  dexterity: z.number().int().min(1).max(30).default(10),
  constitution: z.number().int().min(1).max(30).default(10),
  intelligence: z.number().int().min(1).max(30).default(10),
  wisdom: z.number().int().min(1).max(30).default(10),
  charisma: z.number().int().min(1).max(30).default(10),
  additionalData: z.any().optional()
});

// Get all characters for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    const characters = await prisma.character.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ characters });
  } catch (error) {
    next(error);
  }
});

// Get single character
router.get('/:id', async (req, res, next) => {
  try {
    const character = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!character) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Character not found'
      });
    }

    res.json({ character });
  } catch (error) {
    next(error);
  }
});

// Create character
router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = characterSchema.parse(req.body);
    
    const character = await prisma.character.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ character });
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

// Update character
router.put('/:id', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    // Check if character exists and belongs to user
    const existingCharacter = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingCharacter) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Character not found'
      });
    }

    const validatedData = characterSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const character = await prisma.character.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ character });
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

// Delete character
router.delete('/:id', async (req, res, next) => {
  try {
    const character = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!character) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Character not found'
      });
    }

    await prisma.character.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Character deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

