import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Browse can be used without auth for public content, but we'll require it for consistency
router.use(authenticate);

// Browse/search across all content types
router.get('/', async (req, res, next) => {
  try {
    const { q: search, type, rarity, level, cr, tier, domain, alignment } = req.query;

    const results = {
      items: [],
      monsters: [],
      spells: [],
      classes: [],
      races: [],
      backgrounds: [],
      feats: [],
      subclasses: [],
      pets: [],
      faiths: []
    };

    // Build search condition
    const searchCondition = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    // Items
    if (!type || type === 'item') {
      const itemWhere = {
        userId: req.user.id,
        ...searchCondition,
        ...(rarity && { rarity })
      };
      results.items = await prisma.item.findMany({
        where: itemWhere,
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Monsters
    if (!type || type === 'monster') {
      const monsterWhere = {
        userId: req.user.id,
        ...searchCondition,
        ...(cr && { cr })
      };
      results.monsters = await prisma.monster.findMany({
        where: monsterWhere,
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Spells
    if (!type || type === 'spell') {
      const spellWhere = {
        userId: req.user.id,
        ...searchCondition,
        ...(level && { level: parseInt(level) })
      };
      results.spells = await prisma.spell.findMany({
        where: spellWhere,
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Classes
    if (!type || type === 'class') {
      results.classes = await prisma.class.findMany({
        where: {
          userId: req.user.id,
          ...searchCondition
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Races
    if (!type || type === 'race') {
      results.races = await prisma.race.findMany({
        where: {
          userId: req.user.id,
          ...searchCondition
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Backgrounds
    if (!type || type === 'background') {
      results.backgrounds = await prisma.background.findMany({
        where: {
          userId: req.user.id,
          ...searchCondition
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Feats
    if (!type || type === 'feat') {
      const featWhere = {
        userId: req.user.id,
        ...searchCondition,
        ...(tier && { tier })
      };
      results.feats = await prisma.feat.findMany({
        where: featWhere,
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Subclasses
    if (!type || type === 'subclass') {
      results.subclasses = await prisma.subclass.findMany({
        where: {
          userId: req.user.id,
          ...searchCondition
        },
        include: { parentClass: true },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Pets
    if (!type || type === 'pet') {
      results.pets = await prisma.pet.findMany({
        where: {
          userId: req.user.id,
          ...searchCondition
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Faiths
    if (!type || type === 'faith') {
      const faithWhere = {
        userId: req.user.id,
        ...searchCondition,
        ...(domain && { domain }),
        ...(alignment && { alignment })
      };
      results.faiths = await prisma.faith.findMany({
        where: faithWhere,
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Calculate totals
    const totals = {
      items: results.items.length,
      monsters: results.monsters.length,
      spells: results.spells.length,
      classes: results.classes.length,
      races: results.races.length,
      backgrounds: results.backgrounds.length,
      feats: results.feats.length,
      subclasses: results.subclasses.length,
      pets: results.pets.length,
      faiths: results.faiths.length,
      total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    };

    res.json({
      results,
      totals,
      filters: {
        search,
        type,
        rarity,
        level,
        cr,
        tier,
        domain,
        alignment
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

