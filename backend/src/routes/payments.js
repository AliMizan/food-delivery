const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create payment intent (customer only)
router.post('/create-intent', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { orderId, amount, currency = 'inr' } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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

    if (order.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been paid'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      metadata: {
        orderId,
        customerId: req.user.id,
        restaurantName: order.restaurant.name
      },
      description: `Payment for order ${order.orderNumber}`
    });

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: paymentIntent.id }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Confirm payment (customer only)
router.post('/confirm-payment', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and order ID are required'
      });
    }

    // Verify order exists and belongs to user
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
        message: 'Not authorized to confirm payment for this order'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'completed',
          status: order.status === 'pending' ? 'confirmed' : order.status
        }
      });

      // Create tracking entry
      await prisma.orderTracking.create({
        data: {
          orderId,
          status: 'confirmed',
          message: 'Payment completed successfully'
        }
      });

      // Emit real-time notification to restaurant
      const io = req.app.get('io');
      io.to(`restaurant_${order.restaurantId}`).emit('payment_completed', {
        orderId,
        orderNumber: order.orderNumber,
        amount: order.total
      });

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          paymentStatus: 'completed',
          orderStatus: 'confirmed'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
        data: {
          paymentStatus: paymentIntent.status
        }
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        try {
          // Update order payment status
          const order = await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'completed',
              status: 'confirmed'
            }
          });

          // Create tracking entry
          await prisma.orderTracking.create({
            data: {
              orderId,
              status: 'confirmed',
              message: 'Payment completed via webhook'
            }
          });

          console.log(`Payment succeeded for order ${orderId}`);
        } catch (error) {
          console.error('Error updating order after payment success:', error);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      const failedOrderId = failedPayment.metadata.orderId;

      if (failedOrderId) {
        try {
          // Update order payment status
          await prisma.order.update({
            where: { id: failedOrderId },
            data: { paymentStatus: 'failed' }
          });

          console.log(`Payment failed for order ${failedOrderId}`);
        } catch (error) {
          console.error('Error updating order after payment failure:', error);
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get payment history (customer only)
router.get('/history', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId: req.user.id,
          paymentStatus: { not: 'pending' }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
          restaurant: {
            select: { name: true, image: true }
          }
        }
      }),
      prisma.order.count({
        where: {
          customerId: req.user.id,
          paymentStatus: { not: 'pending' }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refund payment (admin only)
router.post('/refund', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.paymentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment found for this order'
      });
    }

    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order payment is not completed'
      });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      reason: 'requested_by_customer',
      metadata: {
        orderId,
        reason: reason || 'Refund requested'
      }
    });

    // Update order payment status
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'refunded' }
    });

    // Create tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId,
        status: order.status,
        message: `Refund processed: ₹${refund.amount / 100}`
      }
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;