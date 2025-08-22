const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get all restaurants (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      cuisine,
      isVeg,
      sortBy = 'rating',
      sortOrder = 'desc',
      latitude,
      longitude,
      radius = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      status: 'active',
      isOpen: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { cuisine: { has: search } }
      ];
    }

    if (cuisine) {
      where.cuisine = { has: cuisine };
    }

    if (isVeg === 'true') {
      where.isVeg = true;
    }

    // Get restaurants
    const restaurants = await prisma.restaurant.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        name: true,
        description: true,
        cuisine: true,
        image: true,
        rating: true,
        totalReviews: true,
        deliveryTime: true,
        deliveryFee: true,
        minimumOrder: true,
        isVeg: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        isOpen: true,
        openingTime: true,
        closingTime: true
      }
    });

    // Get total count
    const total = await prisma.restaurant.count({ where });

    res.json({
      success: true,
      data: {
        restaurants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get restaurant by ID (public)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { category: 'asc' }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { name: true, avatar: true }
            }
          }
        },
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Restaurant is not available'
      });
    }

    res.json({
      success: true,
      data: { restaurant }
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create restaurant profile (restaurant owner only)
router.post('/', authenticateToken, authorizeRoles('restaurant'), validate(schemas.restaurant), async (req, res) => {
  try {
    // Check if user already has a restaurant
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { userId: req.user.id }
    });

    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant profile already exists'
      });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        ...req.body,
        userId: req.user.id
      },
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: { restaurant }
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update restaurant profile (restaurant owner only)
router.put('/:id', authenticateToken, authorizeRoles('restaurant'), validate(schemas.restaurant), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if restaurant belongs to user
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id }
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (existingRestaurant.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: req.body,
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: { restaurant }
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle restaurant status (restaurant owner only)
router.patch('/:id/toggle-status', authenticateToken, authorizeRoles('restaurant'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen } = req.body;

    // Check if restaurant belongs to user
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id }
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (existingRestaurant.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { isOpen: isOpen !== undefined ? isOpen : !existingRestaurant.isOpen }
    });

    res.json({
      success: true,
      message: `Restaurant ${restaurant.isOpen ? 'opened' : 'closed'} successfully`,
      data: { restaurant }
    });
  } catch (error) {
    console.error('Toggle restaurant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get restaurant analytics (restaurant owner only)
router.get('/:id/analytics', authenticateToken, authorizeRoles('restaurant'), async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    // Check if restaurant belongs to user
    const restaurant = await prisma.restaurant.findUnique({
      where: { id }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this restaurant analytics'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data
    const [totalOrders, totalRevenue, avgOrderValue, popularItems] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: {
          restaurantId: id,
          createdAt: { gte: startDate },
          status: { not: 'cancelled' }
        }
      }),

      // Total revenue
      prisma.order.aggregate({
        where: {
          restaurantId: id,
          createdAt: { gte: startDate },
          status: 'delivered'
        },
        _sum: { total: true }
      }),

      // Average order value
      prisma.order.aggregate({
        where: {
          restaurantId: id,
          createdAt: { gte: startDate },
          status: { not: 'cancelled' }
        },
        _avg: { total: true }
      }),

      // Popular items
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            restaurantId: id,
            createdAt: { gte: startDate },
            status: { not: 'cancelled' }
          }
        },
        _sum: { quantity: true },
        _count: { _all: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10
      })
    ]);

    // Get menu item details for popular items
    const menuItemIds = popularItems.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, price: true, image: true }
    });

    const popularItemsWithDetails = popularItems.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return {
        ...menuItem,
        totalQuantity: item._sum.quantity,
        orderCount: item._count._all
      };
    });

    res.json({
      success: true,
      data: {
        analytics: {
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          avgOrderValue: avgOrderValue._avg.total || 0,
          popularItems: popularItemsWithDetails
        },
        period
      }
    });
  } catch (error) {
    console.error('Get restaurant analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;