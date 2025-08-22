const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Create rider profile (rider only)
router.post('/', authenticateToken, authorizeRoles('rider'), validate(schemas.rider), async (req, res) => {
  try {
    // Check if user already has a rider profile
    const existingRider = await prisma.rider.findUnique({
      where: { userId: req.user.id }
    });

    if (existingRider) {
      return res.status(400).json({
        success: false,
        message: 'Rider profile already exists'
      });
    }

    const rider = await prisma.rider.create({
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
      message: 'Rider profile created successfully',
      data: { rider }
    });
  } catch (error) {
    console.error('Create rider error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get rider profile (rider only)
router.get('/profile', authenticateToken, authorizeRoles('rider'), async (req, res) => {
  try {
    const rider = await prisma.rider.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: { name: true, email: true, phone: true, avatar: true }
        }
      }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found'
      });
    }

    res.json({
      success: true,
      data: { rider }
    });
  } catch (error) {
    console.error('Get rider profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update rider profile (rider only)
router.put('/profile', authenticateToken, authorizeRoles('rider'), validate(schemas.rider), async (req, res) => {
  try {
    const existingRider = await prisma.rider.findUnique({
      where: { userId: req.user.id }
    });

    if (!existingRider) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found'
      });
    }

    const rider = await prisma.rider.update({
      where: { userId: req.user.id },
      data: req.body,
      include: {
        user: {
          select: { name: true, email: true, phone: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Rider profile updated successfully',
      data: { rider }
    });
  } catch (error) {
    console.error('Update rider profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle availability (rider only)
router.patch('/toggle-availability', authenticateToken, authorizeRoles('rider'), async (req, res) => {
  try {
    const existingRider = await prisma.rider.findUnique({
      where: { userId: req.user.id }
    });

    if (!existingRider) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found'
      });
    }

    const rider = await prisma.rider.update({
      where: { userId: req.user.id },
      data: { isAvailable: !existingRider.isAvailable }
    });

    res.json({
      success: true,
      message: `Rider is now ${rider.isAvailable ? 'available' : 'unavailable'}`,
      data: { rider }
    });
  } catch (error) {
    console.error('Toggle rider availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update location (rider only)
router.patch('/location', authenticateToken, authorizeRoles('rider'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const existingRider = await prisma.rider.findUnique({
      where: { userId: req.user.id }
    });

    if (!existingRider) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found'
      });
    }

    const rider = await prisma.rider.update({
      where: { userId: req.user.id },
      data: {
        currentLat: parseFloat(latitude),
        currentLng: parseFloat(longitude)
      }
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: { rider }
    });
  } catch (error) {
    console.error('Update rider location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get rider orders (rider only)
router.get('/orders', authenticateToken, authorizeRoles('rider'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { riderId: req.user.id };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, phone: true }
          },
          restaurant: {
            select: { name: true, address: true, phone: true }
          },
          address: true
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get rider orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available orders for pickup (rider only)
router.get('/available-orders', authenticateToken, authorizeRoles('rider'), async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    // Get rider profile
    const rider = await prisma.rider.findUnique({
      where: { userId: req.user.id }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found'
      });
    }

    if (!rider.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Rider is not available'
      });
    }

    // Get orders ready for pickup
    const orders = await prisma.order.findMany({
      where: {
        status: 'ready',
        riderId: null
      },
      include: {
        customer: {
          select: { name: true, phone: true }
        },
        restaurant: {
          select: { 
            name: true, 
            address: true, 
            phone: true,
            latitude: true,
            longitude: true
          }
        },
        address: true
      },
      orderBy: { readyAt: 'asc' },
      take: 20
    });

    // If location provided, filter by distance
    let filteredOrders = orders;
    if (latitude && longitude) {
      const riderLat = parseFloat(latitude);
      const riderLng = parseFloat(longitude);
      const maxRadius = parseFloat(radius);

      filteredOrders = orders.filter(order => {
        if (!order.restaurant.latitude || !order.restaurant.longitude) {
          return true; // Include if restaurant location not available
        }

        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (order.restaurant.latitude - riderLat) * Math.PI / 180;
        const dLng = (order.restaurant.longitude - riderLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(riderLat * Math.PI / 180) * Math.cos(order.restaurant.latitude * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return distance <= maxRadius;
      });
    }

    res.json({
      success: true,
      data: { orders: filteredOrders }
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Accept order (rider only)
router.post('/accept-order/:orderId', authenticateToken, authorizeRoles('rider'), async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get rider profile
    const rider = await prisma.rider.findUnique({
      where: { userId: req.user.id }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found'
      });
    }

    if (!rider.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Rider is not available'
      });
    }

    // Check if order exists and is ready for pickup
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: { name: true }
        },
        restaurant: {
          select: { name: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Order is not ready for pickup'
      });
    }

    if (order.riderId) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been accepted by another rider'
      });
    }

    // Assign order to rider
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { riderId: rider.id }
    });

    // Create tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId,
        status: 'ready',
        message: `Order accepted by rider ${req.user.name}`
      }
    });

    // Emit real-time notifications
    const io = req.app.get('io');
    
    // Notify customer
    io.to(`user_${order.customerId}`).emit('rider_assigned', {
      orderId,
      riderName: req.user.name,
      riderPhone: req.user.phone
    });

    // Notify restaurant
    io.to(`restaurant_${order.restaurantId}`).emit('rider_assigned', {
      orderId,
      riderName: req.user.name
    });

    res.json({
      success: true,
      message: 'Order accepted successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get rider statistics (rider only)
router.get('/stats', authenticateToken, authorizeRoles('rider'), async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Get rider profile
    const rider = await prisma.rider.findUnique({
      where: { userId: req.user.id }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider profile not found'
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

    // Get statistics
    const [totalDeliveries, completedDeliveries, totalEarnings, avgDeliveryTime] = await Promise.all([
      // Total deliveries
      prisma.order.count({
        where: {
          riderId: rider.id,
          createdAt: { gte: startDate }
        }
      }),

      // Completed deliveries
      prisma.order.count({
        where: {
          riderId: rider.id,
          status: 'delivered',
          createdAt: { gte: startDate }
        }
      }),

      // Total earnings (assuming 10% of order value as delivery fee)
      prisma.order.aggregate({
        where: {
          riderId: rider.id,
          status: 'delivered',
          createdAt: { gte: startDate }
        },
        _sum: { deliveryFee: true }
      }),

      // Average delivery time
      prisma.order.aggregate({
        where: {
          riderId: rider.id,
          status: 'delivered',
          createdAt: { gte: startDate },
          actualTime: { not: null }
        },
        _avg: { actualTime: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalDeliveries,
          completedDeliveries,
          totalEarnings: totalEarnings._sum.deliveryFee || 0,
          avgDeliveryTime: avgDeliveryTime._avg.actualTime || 0,
          rating: rider.rating,
          totalLifetimeDeliveries: rider.totalDeliveries
        },
        period
      }
    });
  } catch (error) {
    console.error('Get rider stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;