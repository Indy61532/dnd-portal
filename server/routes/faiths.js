import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const faithSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional(),
  alignment: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([])
});

router.get('/', async (req, res, next) => {
  try {
    const { domain, alignment, search } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(domain && { domain }),
      ...(alignment && { alignment }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const faiths = await prisma.faith.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ faiths });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const faith = await prisma.faith.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!faith) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Faith not found'
      });
    }

    res.json({ faith });
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = faithSchema.parse(req.body);
    
    const faith = await prisma.faith.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ faith });
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
    const existingFaith = await prisma.faith.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingFaith) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Faith not found'
      });
    }

    const validatedData = faithSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const faith = await prisma.faith.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ faith });
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
    const faith = await prisma.faith.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!faith) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Faith not found'
      });
    }

    await prisma.faith.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Faith deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

