const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FF${timestamp.slice(-6)}${random}`;
};

// Helper function to calculate order totals
const calculateOrderTotals = (items, restaurant) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = restaurant.deliveryFee || 40;
  const platformFee = Math.round(subtotal * 0.02); // 2%
  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + deliveryFee + platformFee + taxes;

  return { subtotal, deliveryFee, platformFee, taxes, total };
};

// Create order (customer only)
router.post('/', authenticateToken, authorizeRoles('customer'), validate(schemas.order), async (req, res) => {
  try {
    const { restaurantId, addressId, items, paymentMethod, specialInstructions } = req.body;

    // Verify restaurant exists and is open
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant || restaurant.status !== 'active' || !restaurant.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is not available for orders'
      });
    }

    // Verify address belongs to user
    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!address || address.userId !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery address'
      });
    }

    // Verify menu items and get current prices
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId,
        isAvailable: true
      }
    });

    if (menuItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Some menu items are not available'
      });
    }

    // Prepare order items with current prices
    const orderItems = items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes
      };
    });

    // Calculate totals
    const { subtotal, deliveryFee, platformFee, taxes, total } = calculateOrderTotals(orderItems, restaurant);

    // Check minimum order value
    if (subtotal < restaurant.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value is ₹${restaurant.minimumOrder}`
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: req.user.id,
        restaurantId,
        addressId,
        paymentMethod,
        subtotal,
        deliveryFee,
        platformFee,
        taxes,
        total,
        specialInstructions,
        estimatedTime: parseInt(restaurant.deliveryTime.split('-')[1]) || 40,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        restaurant: {
          select: {
            name: true,
            phone: true,
            address: true
          }
        },
        address: true
      }
    });

    // Create initial tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId: order.id,
        status: 'pending',
        message: 'Order placed successfully'
      }
    });

    // Emit real-time notification to restaurant
    const io = req.app.get('io');
    io.to(`restaurant_${restaurantId}`).emit('new_order', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: req.user.name,
      total: order.total,
      items: order.items.length
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user orders (customer only)
router.get('/my-orders', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { customerId: req.user.id };
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
          items: {
            include: {
              menuItem: {
                select: { name: true, image: true }
              }
            }
          },
          restaurant: {
            select: { name: true, image: true, phone: true }
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
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get restaurant orders (restaurant owner only)
router.get('/restaurant-orders', authenticateToken, authorizeRoles('restaurant'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get user's restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: req.user.id }
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const where = { restaurantId: restaurant.id };
    
    if (status) {
      where.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      where.createdAt = {
        gte: startDate,
        lt: endDate
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              menuItem: {
                select: { name: true, image: true }
              }
            }
          },
          customer: {
            select: { name: true, phone: true }
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
    console.error('Get restaurant orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        customer: {
          select: { name: true, phone: true, email: true }
        },
        restaurant: {
          select: { name: true, phone: true, address: true, image: true }
        },
        address: true,
        rider: {
          select: { id: true },
          include: {
            user: {
              select: { name: true, phone: true }
            }
          }
        },
        tracking: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isCustomer = req.user.role === 'customer' && order.customerId === req.user.id;
    const isRestaurant = req.user.role === 'restaurant' && order.restaurant.userId === req.user.id;
    const isRider = req.user.role === 'rider' && order.riderId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isRestaurant && !isRider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update order status (restaurant owner or rider only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get order with restaurant info
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: true,
        customer: {
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

    // Check authorization based on status change
    let isAuthorized = false;
    
    if (req.user.role === 'restaurant' && order.restaurant.userId === req.user.id) {
      // Restaurant can update to: confirmed, preparing, ready, cancelled
      isAuthorized = ['confirmed', 'preparing', 'ready', 'cancelled'].includes(status);
    } else if (req.user.role === 'rider' && order.riderId === req.user.id) {
      // Rider can update to: picked_up, delivered
      isAuthorized = ['picked_up', 'delivered'].includes(status);
    } else if (req.user.role === 'admin') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order status'
      });
    }

    // Update order status with timestamp
    const updateData = { status };
    const now = new Date();

    switch (status) {
      case 'confirmed':
        updateData.confirmedAt = now;
        break;
      case 'preparing':
        updateData.preparingAt = now;
        break;
      case 'ready':
        updateData.readyAt = now;
        break;
      case 'picked_up':
        updateData.pickedUpAt = now;
        break;
      case 'delivered':
        updateData.deliveredAt = now;
        updateData.actualTime = Math.floor((now - order.createdAt) / (1000 * 60)); // in minutes
        break;
      case 'cancelled':
        updateData.cancelledAt = now;
        break;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData
    });

    // Create tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId: id,
        status,
        message: message || `Order ${status}`
      }
    });

    // Emit real-time updates
    const io = req.app.get('io');
    
    // Notify customer
    io.to(`user_${order.customerId}`).emit('order_status_update', {
      orderId: id,
      status,
      message: message || `Your order is ${status}`
    });

    // Notify order tracking room
    io.to(`order_${id}`).emit('status_update', {
      status,
      message,
      timestamp: now
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel order (customer only, within time limit)
router.patch('/:id/cancel', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
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
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Check time limit (e.g., 5 minutes after placing order)
    const timeDiff = (new Date() - order.createdAt) / (1000 * 60); // in minutes
    if (timeDiff > 5 && order.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled after 5 minutes of confirmation'
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      }
    });

    // Create tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId: id,
        status: 'cancelled',
        message: `Order cancelled by customer. Reason: ${reason || 'No reason provided'}`
      }
    });

    // Emit real-time notification to restaurant
    const io = req.app.get('io');
    io.to(`restaurant_${order.restaurantId}`).emit('order_cancelled', {
      orderId: id,
      orderNumber: order.orderNumber,
      reason
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get order tracking
router.get('/:id/tracking', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        restaurantId: true,
        riderId: true,
        restaurant: {
          select: { userId: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isCustomer = req.user.role === 'customer' && order.customerId === req.user.id;
    const isRestaurant = req.user.role === 'restaurant' && order.restaurant.userId === req.user.id;
    const isRider = req.user.role === 'rider' && order.riderId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isRestaurant && !isRider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order tracking'
      });
    }

    const tracking = await prisma.orderTracking.findMany({
      where: { orderId: id },
      orderBy: { timestamp: 'asc' }
    });

    res.json({
      success: true,
      data: { tracking }
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;