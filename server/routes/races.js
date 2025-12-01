import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const raceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([])
});

router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const races = await prisma.race.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ races });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const race = await prisma.race.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!race) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Race not found'
      });
    }

    res.json({ race });
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = raceSchema.parse(req.body);
    
    const race = await prisma.race.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ race });
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
    const existingRace = await prisma.race.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingRace) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Race not found'
      });
    }

    const validatedData = raceSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const race = await prisma.race.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ race });
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
    const race = await prisma.race.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!race) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Race not found'
      });
    }

    await prisma.race.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Race deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

