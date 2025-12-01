import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const monsterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional(),
  cr: z.string().optional(),
  ac: z.number().int().optional(),
  hp: z.number().int().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([])
});

router.get('/', async (req, res, next) => {
  try {
    const { type, cr, search } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(type && { type }),
      ...(cr && { cr }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const monsters = await prisma.monster.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ monsters });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const monster = await prisma.monster.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!monster) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Monster not found'
      });
    }

    res.json({ monster });
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = monsterSchema.parse(req.body);
    
    const monster = await prisma.monster.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ monster });
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
    const existingMonster = await prisma.monster.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingMonster) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Monster not found'
      });
    }

    const validatedData = monsterSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const monster = await prisma.monster.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ monster });
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
    const monster = await prisma.monster.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!monster) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Monster not found'
      });
    }

    await prisma.monster.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Monster deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

