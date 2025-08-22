const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get menu items for a restaurant (public)
router.get('/restaurant/:restaurantId', optionalAuth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, isVeg, isAvailable = 'true', search } = req.query;

    // Build where clause
    const where = { restaurantId };

    if (category) {
      where.category = category;
    }

    if (isVeg === 'true') {
      where.isVeg = true;
    }

    if (isAvailable === 'true') {
      where.isAvailable = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group by category
    const groupedItems = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        menuItems,
        groupedItems
      }
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get menu item by ID (public)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            rating: true,
            deliveryTime: true,
            deliveryFee: true
          }
        }
      }
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: { menuItem }
    });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create menu item (restaurant owner only)
router.post('/', authenticateToken, authorizeRoles('restaurant'), validate(schemas.menuItem), async (req, res) => {
  try {
    const { restaurantId, ...itemData } = req.body;

    // Check if restaurant belongs to user
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
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
        message: 'Not authorized to add items to this restaurant'
      });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        ...itemData,
        restaurantId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { menuItem }
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update menu item (restaurant owner only)
router.put('/:id', authenticateToken, authorizeRoles('restaurant'), validate(schemas.menuItem), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if menu item exists and belongs to user's restaurant
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: true }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (existingItem.restaurant.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this menu item'
      });
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { menuItem }
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle menu item availability (restaurant owner only)
router.patch('/:id/toggle-availability', authenticateToken, authorizeRoles('restaurant'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if menu item exists and belongs to user's restaurant
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: true }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (existingItem.restaurant.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this menu item'
      });
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !existingItem.isAvailable }
    });

    res.json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: { menuItem }
    });
  } catch (error) {
    console.error('Toggle menu item availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete menu item (restaurant owner only)
router.delete('/:id', authenticateToken, authorizeRoles('restaurant'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if menu item exists and belongs to user's restaurant
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: true }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (existingItem.restaurant.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this menu item'
      });
    }

    await prisma.menuItem.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get menu categories for a restaurant (public)
router.get('/restaurant/:restaurantId/categories', optionalAuth, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const categories = await prisma.menuItem.findMany({
      where: { restaurantId },
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(item => item.category);

    res.json({
      success: true,
      data: { categories: categoryList }
    });
  } catch (error) {
    console.error('Get menu categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;