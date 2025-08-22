const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get available coupons (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const now = new Date();

    const where = {
      isActive: true,
      validFrom: { lte: now },
      validUntil: { gte: now }
    };

    // Filter by restaurant if specified
    if (restaurantId) {
      where.OR = [
        { applicableFor: { has: 'all' } },
        { restaurantIds: { has: restaurantId } }
      ];
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        discountType: true,
        discountValue: true,
        minimumOrder: true,
        maximumDiscount: true,
        usageLimit: true,
        usedCount: true,
        validUntil: true,
        applicableFor: true
      }
    });

    // Filter out coupons that have reached usage limit
    const availableCoupons = coupons.filter(coupon => 
      !coupon.usageLimit || coupon.usedCount < coupon.usageLimit
    );

    res.json({
      success: true,
      data: { coupons: availableCoupons }
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Validate coupon
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, restaurantId, orderValue } = req.body;

    if (!code || !restaurantId || !orderValue) {
      return res.status(400).json({
        success: false,
        message: 'Code, restaurant ID, and order value are required'
      });
    }

    const now = new Date();

    const coupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not active'
      });
    }

    // Check validity period
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired or is not yet valid'
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit exceeded'
      });
    }

    // Check minimum order value
    if (orderValue < coupon.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value should be ₹${coupon.minimumOrder}`
      });
    }

    // Check if applicable for restaurant
    const isApplicable = coupon.applicableFor.includes('all') || 
                        coupon.restaurantIds.includes(restaurantId);

    if (!isApplicable) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not applicable for this restaurant'
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderValue * coupon.discountValue) / 100;
      if (coupon.maximumDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, orderValue);

    res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          title: coupon.title,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        },
        discountAmount: Math.round(discountAmount * 100) / 100
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create coupon (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      minimumOrder,
      maximumDiscount,
      usageLimit,
      validFrom,
      validUntil,
      applicableFor,
      restaurantIds
    } = req.body;

    // Validate required fields
    if (!code || !title || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        title,
        description,
        discountType,
        discountValue,
        minimumOrder: minimumOrder || 0,
        maximumDiscount,
        usageLimit,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        applicableFor: applicableFor || ['all'],
        restaurantIds: restaurantIds || []
      }
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: { coupon }
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update coupon (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Check if code is being changed and if new code already exists
    if (req.body.code && req.body.code !== existingCoupon.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: req.body.code.toUpperCase() }
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
    }

    const updateData = { ...req.body };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: { coupon }
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete coupon (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle coupon status (admin only)
router.patch('/:id/toggle-status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: !existingCoupon.isActive }
    });

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { coupon }
    });
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;