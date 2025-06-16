const express = require('express');
const { topUpWallet } = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/top-up', authenticate, authorize(['customer']), topUpWallet);

module.exports = router;