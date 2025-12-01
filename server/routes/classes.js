import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const classSchema = z.object({
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

    const classes = await prisma.class.findMany({
      where,
      include: { subclasses: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ classes });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const classItem = await prisma.class.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: { subclasses: true }
    });

    if (!classItem) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Class not found'
      });
    }

    res.json({ class: classItem });
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = classSchema.parse(req.body);
    
    const classItem = await prisma.class.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ class: classItem });
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
    const existingClass = await prisma.class.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingClass) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Class not found'
      });
    }

    const validatedData = classSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const classItem = await prisma.class.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ class: classItem });
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
    const classItem = await prisma.class.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!classItem) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Class not found'
      });
    }

    await prisma.class.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Class deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

