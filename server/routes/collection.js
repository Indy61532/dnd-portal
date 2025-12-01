import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

const validContentTypes = ['item', 'monster', 'spell', 'class', 'race', 'background', 'feat', 'subclass', 'pet', 'faith'];

// Get user's collection
router.get('/', async (req, res, next) => {
  try {
    const { contentType } = req.query;

    const where = {
      userId: req.user.id,
      ...(contentType && validContentTypes.includes(contentType) && { contentType })
    };

    const collections = await prisma.collection.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Fetch actual content for each collection item
    const collectionWithContent = await Promise.all(
      collections.map(async (collection) => {
        let content = null;

        switch (collection.contentType) {
          case 'item':
            content = await prisma.item.findUnique({ where: { id: collection.contentId } });
            break;
          case 'monster':
            content = await prisma.monster.findUnique({ where: { id: collection.contentId } });
            break;
          case 'spell':
            content = await prisma.spell.findUnique({ where: { id: collection.contentId } });
            break;
          case 'class':
            content = await prisma.class.findUnique({ where: { id: collection.contentId } });
            break;
          case 'race':
            content = await prisma.race.findUnique({ where: { id: collection.contentId } });
            break;
          case 'background':
            content = await prisma.background.findUnique({ where: { id: collection.contentId } });
            break;
          case 'feat':
            content = await prisma.feat.findUnique({ where: { id: collection.contentId } });
            break;
          case 'subclass':
            content = await prisma.subclass.findUnique({ 
              where: { id: collection.contentId },
              include: { parentClass: true }
            });
            break;
          case 'pet':
            content = await prisma.pet.findUnique({ where: { id: collection.contentId } });
            break;
          case 'faith':
            content = await prisma.faith.findUnique({ where: { id: collection.contentId } });
            break;
        }

        return {
          ...collection,
          content
        };
      })
    );

    res.json({ collection: collectionWithContent });
  } catch (error) {
    next(error);
  }
});

// Add to collection
router.post('/:contentType/:contentId', async (req, res, next) => {
  try {
    const { contentType, contentId } = req.params;

    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Invalid content type',
        message: `Content type must be one of: ${validContentTypes.join(', ')}`
      });
    }

    // Verify content exists
    let contentExists = false;
    switch (contentType) {
      case 'item':
        contentExists = !!(await prisma.item.findUnique({ where: { id: contentId } }));
        break;
      case 'monster':
        contentExists = !!(await prisma.monster.findUnique({ where: { id: contentId } }));
        break;
      case 'spell':
        contentExists = !!(await prisma.spell.findUnique({ where: { id: contentId } }));
        break;
      case 'class':
        contentExists = !!(await prisma.class.findUnique({ where: { id: contentId } }));
        break;
      case 'race':
        contentExists = !!(await prisma.race.findUnique({ where: { id: contentId } }));
        break;
      case 'background':
        contentExists = !!(await prisma.background.findUnique({ where: { id: contentId } }));
        break;
      case 'feat':
        contentExists = !!(await prisma.feat.findUnique({ where: { id: contentId } }));
        break;
      case 'subclass':
        contentExists = !!(await prisma.subclass.findUnique({ where: { id: contentId } }));
        break;
      case 'pet':
        contentExists = !!(await prisma.pet.findUnique({ where: { id: contentId } }));
        break;
      case 'faith':
        contentExists = !!(await prisma.faith.findUnique({ where: { id: contentId } }));
        break;
    }

    if (!contentExists) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Content not found'
      });
    }

    // Add to collection
    const collection = await prisma.collection.create({
      data: {
        userId: req.user.id,
        contentType,
        contentId
      }
    });

    res.status(201).json({ collection });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Already in collection',
        message: 'This item is already in your collection'
      });
    }
    next(error);
  }
});

// Remove from collection
router.delete('/:contentType/:contentId', async (req, res, next) => {
  try {
    const { contentType, contentId } = req.params;

    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Invalid content type',
        message: `Content type must be one of: ${validContentTypes.join(', ')}`
      });
    }

    const collection = await prisma.collection.findFirst({
      where: {
        userId: req.user.id,
        contentType,
        contentId
      }
    });

    if (!collection) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Item not found in collection'
      });
    }

    await prisma.collection.delete({
      where: { id: collection.id }
    });

    res.json({
      message: 'Item removed from collection successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Check if item is in collection
router.get('/:contentType/:contentId', async (req, res, next) => {
  try {
    const { contentType, contentId } = req.params;

    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Invalid content type',
        message: `Content type must be one of: ${validContentTypes.join(', ')}`
      });
    }

    const collection = await prisma.collection.findFirst({
      where: {
        userId: req.user.id,
        contentType,
        contentId
      }
    });

    res.json({
      inCollection: !!collection
    });
  } catch (error) {
    next(error);
  }
});

export default router;

