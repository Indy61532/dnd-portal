import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const petSchema = z.object({
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

    const pets = await prisma.pet.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ pets });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pet = await prisma.pet.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!pet) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Pet not found'
      });
    }

    res.json({ pet });
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = petSchema.parse(req.body);
    
    const pet = await prisma.pet.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ pet });
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
    const existingPet = await prisma.pet.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingPet) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Pet not found'
      });
    }

    const validatedData = petSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const pet = await prisma.pet.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ pet });
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
    const pet = await prisma.pet.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!pet) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Pet not found'
      });
    }

    await prisma.pet.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

