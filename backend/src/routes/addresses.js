const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get user addresses (customer only)
router.get('/', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: { addresses }
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get address by ID (customer only)
router.get('/:id', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    if (address.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this address'
      });
    }

    res.json({
      success: true,
      data: { address }
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create address (customer only)
router.post('/', authenticateToken, authorizeRoles('customer'), validate(schemas.address), async (req, res) => {
  try {
    const addressData = { ...req.body, userId: req.user.id };

    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    // If this is the first address, make it default
    const existingAddressCount = await prisma.address.count({
      where: { userId: req.user.id }
    });

    if (existingAddressCount === 0) {
      addressData.isDefault = true;
    }

    const address = await prisma.address.create({
      data: addressData
    });

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: { address }
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update address (customer only)
router.put('/:id', authenticateToken, authorizeRoles('customer'), validate(schemas.address), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    if (existingAddress.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this address'
      });
    }

    // If setting as default, unset other default addresses
    if (req.body.isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: req.user.id,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { address }
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Set default address (customer only)
router.patch('/:id/set-default', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    if (existingAddress.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this address'
      });
    }

    // Unset all default addresses for user
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false }
    });

    // Set this address as default
    const address = await prisma.address.update({
      where: { id },
      data: { isDefault: true }
    });

    res.json({
      success: true,
      message: 'Default address updated successfully',
      data: { address }
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete address (customer only)
router.delete('/:id', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    if (existingAddress.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this address'
      });
    }

    // Check if address is being used in any pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        addressId: id,
        status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'] }
      }
    });

    if (pendingOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete address that is being used in active orders'
      });
    }

    await prisma.address.delete({
      where: { id }
    });

    // If deleted address was default, set another address as default
    if (existingAddress.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });

      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true }
        });
      }
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;