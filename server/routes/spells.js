import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const spellSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z.number().int().min(0).max(9).default(0),
  type: z.string().optional(),
  range: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([])
});

router.get('/', async (req, res, next) => {
  try {
    const { level, type, search } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(level && { level: parseInt(level) }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const spells = await prisma.spell.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ spells });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const spell = await prisma.spell.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!spell) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Spell not found'
      });
    }

    res.json({ spell });
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = spellSchema.parse(req.body);
    
    const spell = await prisma.spell.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ spell });
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

router.put('/:id', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const existingSpell = await prisma.spell.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingSpell) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Spell not found'
      });
    }

    const validatedData = spellSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const spell = await prisma.spell.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ spell });
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

router.delete('/:id', async (req, res, next) => {
  try {
    const spell = await prisma.spell.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!spell) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Spell not found'
      });
    }

    await prisma.spell.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Spell deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

