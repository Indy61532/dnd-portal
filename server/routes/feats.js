import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const featSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tier: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([])
});

router.get('/', async (req, res, next) => {
  try {
    const { tier, search } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(tier && { tier }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const feats = await prisma.feat.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ feats });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const feat = await prisma.feat.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!feat) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Feat not found'
      });
    }

    res.json({ feat });
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = featSchema.parse(req.body);
    
    const feat = await prisma.feat.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ feat });
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
    const existingFeat = await prisma.feat.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingFeat) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Feat not found'
      });
    }

    const validatedData = featSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const feat = await prisma.feat.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ feat });
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
    const feat = await prisma.feat.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!feat) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Feat not found'
      });
    }

    await prisma.feat.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Feat deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

