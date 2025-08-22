const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get reviews for a restaurant (public)
router.get('/restaurant/:restaurantId', optionalAuth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { restaurantId };
    if (rating) {
      where.rating = parseInt(rating);
    }

    const [reviews, total, avgRating] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, avatar: true }
          }
        }
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
        _count: { _all: true }
      })
    ]);

    // Update restaurant rating
    if (avgRating._count._all > 0) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          rating: Math.round(avgRating._avg.rating * 10) / 10,
          totalReviews: avgRating._count._all
        }
      });
    }

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: {
          averageRating: avgRating._avg.rating || 0,
          totalReviews: avgRating._count._all
        }
      }
    });
  } catch (error) {
    console.error('Get restaurant reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user reviews (customer only)
router.get('/my-reviews', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { customerId: req.user.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: { name: true, image: true }
          }
        }
      }),
      prisma.review.count({
        where: { customerId: req.user.id }
      })
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create review (customer only)
router.post('/', authenticateToken, authorizeRoles('customer'), validate(schemas.review), async (req, res) => {
  try {
    const { restaurantId, orderId, rating, comment, images } = req.body;

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // If orderId is provided, verify the order
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.customerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to review this order'
        });
      }

      if (order.restaurantId !== restaurantId) {
        return res.status(400).json({
          success: false,
          message: 'Order does not belong to this restaurant'
        });
      }

      if (order.status !== 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Can only review delivered orders'
        });
      }

      // Check if review already exists for this order
      const existingReview = await prisma.review.findFirst({
        where: {
          customerId: req.user.id,
          restaurantId,
          orderId
        }
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Review already exists for this order'
        });
      }
    } else {
      // Check if user has ordered from this restaurant
      const hasOrdered = await prisma.order.findFirst({
        where: {
          customerId: req.user.id,
          restaurantId,
          status: 'delivered'
        }
      });

      if (!hasOrdered) {
        return res.status(400).json({
          success: false,
          message: 'You can only review restaurants you have ordered from'
        });
      }
    }

    const review = await prisma.review.create({
      data: {
        customerId: req.user.id,
        restaurantId,
        orderId,
        rating,
        comment,
        images: images || [],
        isVerified: !!orderId // Verified if linked to an order
      },
      include: {
        customer: {
          select: { name: true, avatar: true }
        },
        restaurant: {
          select: { name: true }
        }
      }
    });

    // Update restaurant rating
    const avgRating = await prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
      _count: { _all: true }
    });

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        rating: Math.round(avgRating._avg.rating * 10) / 10,
        totalReviews: avgRating._count._all
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update review (customer only)
router.put('/:id', authenticateToken, authorizeRoles('customer'), validate(schemas.review), async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id }
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (existingReview.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Check if review is older than 7 days
    const daysDiff = (new Date() - existingReview.createdAt) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be edited within 7 days'
      });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        rating,
        comment,
        images: images || existingReview.images
      },
      include: {
        customer: {
          select: { name: true, avatar: true }
        },
        restaurant: {
          select: { name: true }
        }
      }
    });

    // Update restaurant rating
    const avgRating = await prisma.review.aggregate({
      where: { restaurantId: existingReview.restaurantId },
      _avg: { rating: true },
      _count: { _all: true }
    });

    await prisma.restaurant.update({
      where: { id: existingReview.restaurantId },
      data: {
        rating: Math.round(avgRating._avg.rating * 10) / 10,
        totalReviews: avgRating._count._all
      }
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete review (customer only)
router.delete('/:id', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id }
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (existingReview.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await prisma.review.delete({
      where: { id }
    });

    // Update restaurant rating
    const avgRating = await prisma.review.aggregate({
      where: { restaurantId: existingReview.restaurantId },
      _avg: { rating: true },
      _count: { _all: true }
    });

    await prisma.restaurant.update({
      where: { id: existingReview.restaurantId },
      data: {
        rating: avgRating._count._all > 0 ? Math.round(avgRating._avg.rating * 10) / 10 : 0,
        totalReviews: avgRating._count._all
      }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get review by ID (public)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        customer: {
          select: { name: true, avatar: true }
        },
        restaurant: {
          select: { name: true, image: true }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: { review }
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;