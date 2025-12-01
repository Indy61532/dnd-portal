import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const subclassSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentClassId: z.string().min(1, 'Parent class ID is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([])
});

router.get('/', async (req, res, next) => {
  try {
    const { parentClassId, search } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(parentClassId && { parentClassId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const subclasses = await prisma.subclass.findMany({
      where,
      include: { parentClass: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ subclasses });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const subclass = await prisma.subclass.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: { parentClass: true }
    });

    if (!subclass) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Subclass not found'
      });
    }

    res.json({ subclass });
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = subclassSchema.parse(req.body);
    
    // Verify parent class exists and belongs to user
    const parentClass = await prisma.class.findFirst({
      where: {
        id: validatedData.parentClassId,
        userId: req.user.id
      }
    });

    if (!parentClass) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Parent class not found'
      });
    }
    
    const subclass = await prisma.subclass.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      },
      include: { parentClass: true }
    });

    res.status(201).json({ subclass });
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
    const existingSubclass = await prisma.subclass.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingSubclass) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Subclass not found'
      });
    }

    const validatedData = subclassSchema.partial().parse(req.body);
    
    // If parentClassId is being updated, verify it exists
    if (validatedData.parentClassId) {
      const parentClass = await prisma.class.findFirst({
        where: {
          id: validatedData.parentClassId,
          userId: req.user.id
        }
      });

      if (!parentClass) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Parent class not found'
        });
      }
    }
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const subclass = await prisma.subclass.update({
      where: { id: req.params.id },
      data: updateData,
      include: { parentClass: true }
    });

    res.json({ subclass });
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
    const subclass = await prisma.subclass.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!subclass) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Subclass not found'
      });
    }

    await prisma.subclass.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Subclass deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

