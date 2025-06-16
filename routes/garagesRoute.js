const express = require('express');
const { createGarage, addGarageImage, getGarages, updateGarage, deleteGarage } = require('../controllers/garageController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, authorize(['garage_admin']), createGarage);
router.post('/images', authenticate, authorize(['garage_admin']), addGarageImage);
router.get('/', getGarages);
router.put('/:id', authenticate, authorize(['garage_admin']), updateGarage);
router.delete('/:id', authenticate, authorize(['garage_admin', 'admin']), deleteGarage);

module.exports = router;