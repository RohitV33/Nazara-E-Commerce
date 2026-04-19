const express = require('express');
const router = express.Router({ mergeParams: true }); 
const {
  getProductReviews, addReview, updateReview, deleteReview, checkCanReview
} = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');


router.get('/', getProductReviews);


router.get('/can-review', authenticate, checkCanReview);
router.post('/',
  authenticate,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ max: 1000 }).withMessage('Comment too long'),
    validate,
  ],
  addReview
);
router.put('/:reviewId',
  authenticate,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ max: 1000 }).withMessage('Comment too long'),
    validate,
  ],
  updateReview
);
router.delete('/:reviewId', authenticate, deleteReview);

module.exports = router;
