import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schema
const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  weight: z.number().optional(),
  cost: z.string().optional(),
  rarity: z.string().optional(),
  isMagic: z.boolean().default(false),
  armorAC: z.number().int().optional(),
  weaponType: z.string().optional(),
  diceTrove: z.string().optional(),
  dieType: z.string().optional(),
  range: z.string().optional(),
  tags: z.array(z.string()).default([])
});

// Get all items (with optional filters)
router.get('/', async (req, res, next) => {
  try {
    const { type, rarity, isMagic, search } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(type && { type }),
      ...(rarity && { rarity }),
      ...(isMagic !== undefined && { isMagic: isMagic === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// Get single item
router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.item.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Item not found'
      });
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// Create item
router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = itemSchema.parse(req.body);
    
    const item = await prisma.item.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id
      }
    });

    res.status(201).json({ item });
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

// Update item
router.put('/:id', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const existingItem = await prisma.item.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingItem) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Item not found'
      });
    }

    const validatedData = itemSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ item });
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

// Delete item
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await prisma.item.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Item not found'
      });
    }

    await prisma.item.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

