const Rating = require('../models/Rating');
const Garage = require('../models/Garage');
const AuditLog = require('../models/AuditLog');

const createRating = async (req, res) => {
  const { garage_id, booking_id, rating, comment } = req.body;

  try {
    const booking = await Booking.findById(booking_id);
    if (!booking || booking.customer_id !== req.user.user_id) {
      return res.status(400).json({ message: 'Booking not found or access denied' });
    }

    const rating_id = await Rating.create({
      customer_id: req.user.user_id,
      garage_id,
      booking_id,
      rating,
      comment
    });

    const ratings = await Rating.getByGarageId(garage_id);
    const rating_average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    await Garage.update(garage_id, { rating_average });

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'Rating created',
      entity_type: 'rating',
      entity_id: rating_id,
      details: { garage_id, rating, comment }
    });

    res.status(201).json({ message: 'Rating created successfully', rating_id });
  } catch (error) {
    throw error;
  }
};

module.exports = { createRating };