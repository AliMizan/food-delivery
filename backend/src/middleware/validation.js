const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Common validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('customer', 'restaurant', 'rider').default('customer'),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    avatar: Joi.string().uri().optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  address: Joi.object({
    title: Joi.string().required(),
    house: Joi.string().required(),
    area: Joi.string().required(),
    landmark: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().default('Telangana'),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    isDefault: Joi.boolean().default(false)
  }),

  restaurant: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    cuisine: Joi.array().items(Joi.string()).min(1).required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    email: Joi.string().email().optional(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().default('Telangana'),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    isVeg: Joi.boolean().default(false),
    deliveryTime: Joi.string().default('30-40 min'),
    deliveryFee: Joi.number().min(0).default(40),
    minimumOrder: Joi.number().min(0).default(100),
    openingTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),
    closingTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('23:00')
  }),

  menuItem: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().min(0).required(),
    originalPrice: Joi.number().min(0).optional(),
    category: Joi.string().required(),
    isVeg: Joi.boolean().default(true),
    isSpicy: Joi.boolean().default(false),
    isAvailable: Joi.boolean().default(true),
    preparationTime: Joi.number().min(1).max(120).default(15),
    ingredients: Joi.array().items(Joi.string()).optional(),
    allergens: Joi.array().items(Joi.string()).optional()
  }),

  order: Joi.object({
    restaurantId: Joi.string().uuid().required(),
    addressId: Joi.string().uuid().required(),
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.string().uuid().required(),
        quantity: Joi.number().min(1).required(),
        notes: Joi.string().max(200).optional()
      })
    ).min(1).required(),
    paymentMethod: Joi.string().valid('card', 'upi', 'cod').required(),
    specialInstructions: Joi.string().max(500).optional()
  }),

  review: Joi.object({
    restaurantId: Joi.string().uuid().required(),
    orderId: Joi.string().uuid().optional(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500).optional()
  }),

  rider: Joi.object({
    vehicleType: Joi.string().valid('bike', 'scooter', 'bicycle').required(),
    vehicleNumber: Joi.string().required(),
    licenseNumber: Joi.string().required(),
    aadharNumber: Joi.string().pattern(/^\d{12}$/).required(),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
    bankAccount: Joi.string().required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required()
  })
};

module.exports = {
  validate,
  schemas
};