import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const backgroundSchema = z.object({
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

    const backgrounds = await prisma.background.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ backgrounds });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const background = await prisma.background.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!background) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Background not found'
      });
    }

    res.json({ background });
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = backgroundSchema.parse(req.body);
    
    const background = await prisma.background.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ background });
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
    const existingBackground = await prisma.background.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingBackground) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Background not found'
      });
    }

    const validatedData = backgroundSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const background = await prisma.background.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ background });
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
    const background = await prisma.background.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!background) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Background not found'
      });
    }

    await prisma.background.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Background deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

