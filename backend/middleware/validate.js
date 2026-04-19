const { body, validationResult } = require('express-validator');


const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const productValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Name must be 2-255 characters'),
  body('price').notEmpty().withMessage('Price is required')
    .isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('original_price').optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Original price must be positive'),
  validate,
];

const cartValidator = [
  body('product_id').notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('quantity').optional()
    .isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
  validate,
];

const orderValidator = [
  body('shipping_address').notEmpty().withMessage('Shipping address is required'),
  body('shipping_address.name').notEmpty().withMessage('Name is required'),
  body('shipping_address.email').isEmail().withMessage('Valid email is required'),
  body('shipping_address.address').notEmpty().withMessage('Street address is required'),
  body('shipping_address.city').notEmpty().withMessage('City is required'),
  body('shipping_address.state').notEmpty().withMessage('State is required'),
  body('shipping_address.zip').notEmpty().withMessage('ZIP code is required'),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  productValidator,
  cartValidator,
  orderValidator,
};
