const express = require('express');
const { createBooking, cancelBooking } = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, authorize(['customer']), createBooking);
router.put('/cancel/:id', authenticate, authorize(['customer']), cancelBooking);

module.exports = router;