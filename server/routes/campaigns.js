import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional()
});

// Get all campaigns (owned or member)
router.get('/', async (req, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ campaigns });
  } catch (error) {
    next(error);
  }
});

// Get single campaign
router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Campaign not found'
      });
    }

    res.json({ campaign });
  } catch (error) {
    next(error);
  }
});

// Create campaign
router.post('/', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const validatedData = campaignSchema.parse(req.body);
    
    const campaign = await prisma.campaign.create({
      data: {
        ...validatedData,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        ownerId: req.user.id
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatar: true
          }
        },
        members: []
      }
    });

    res.status(201).json({ campaign });
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

// Update campaign (only owner)
router.put('/:id', uploadSingle('image'), handleUploadError, async (req, res, next) => {
  try {
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });

    if (!existingCampaign) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Campaign not found or you are not the owner'
      });
    }

    const validatedData = campaignSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.json({ campaign });
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

// Delete campaign (only owner)
router.delete('/:id', async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Campaign not found or you are not the owner'
      });
    }

    await prisma.campaign.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Add member to campaign
router.post('/:id/members', async (req, res, next) => {
  try {
    const { userId, role = 'player' } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID required',
        message: 'Please provide a user ID'
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Campaign not found or you are not the owner'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }

    // Add member
    const member = await prisma.campaignMember.create({
      data: {
        campaignId: req.params.id,
        userId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({ member });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Already a member',
        message: 'User is already a member of this campaign'
      });
    }
    next(error);
  }
});

// Remove member from campaign
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Campaign not found or you are not the owner'
      });
    }

    await prisma.campaignMember.deleteMany({
      where: {
        campaignId: req.params.id,
        userId: req.params.userId
      }
    });

    res.json({
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

