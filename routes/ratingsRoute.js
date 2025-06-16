const express = require('express');
const { createRating } = require('../controllers/ratingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, authorize(['customer']), createRating);

module.exports = router;