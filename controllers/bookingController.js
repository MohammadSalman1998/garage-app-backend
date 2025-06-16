const Booking = require('../models/Booking');
const ParkingSpot = require('../models/ParkingSpot');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { generateQRCode } = require('../utils/qrCodeGenerator');

const createBooking = async (req, res) => {
  const { garage_id, spot_id, booked_entry_time, booked_exit_time, payment_method } = req.body;

  try {
    const spot = await ParkingSpot.findById(spot_id);
    if (!spot || spot.status !== 'available') {
      return res.status(400).json({ message: 'Parking spot is not available' });
    }

    const garage = await Garage.findById(garage_id);
    if (!garage) {
      return res.status(400).json({ message: 'Garage not found' });
    }

    const booked_duration_hours = (new Date(booked_exit_time) - new Date(booked_entry_time)) / (1000 * 60 * 60);
    if (booked_duration_hours < garage.min_booking_hours) {
      return res.status(400).json({ message: `Minimum booking duration is ${garage.min_booking_hours} hours` });
    }

    const booking_fee = booked_duration_hours * garage.hourly_rate * spot.price_modifier;
    const qr_code_identifier = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const qr_code_expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    const qr_code = await generateQRCode(qr_code_identifier);

    const booking_id = await Booking.create({
      customer_id: req.user.user_id,
      garage_id,
      spot_id,
      booked_entry_time,
      booked_exit_time,
      booked_duration_hours,
      booking_fee,
      qr_code_identifier,
      qr_code_expiry
    });

    await ParkingSpot.updateStatus(spot_id, 'occupied');

    if (payment_method === 'e_wallet') {
      const wallet = await Wallet.findByUserAndGarage(req.user.user_id, garage_id);
      if (!wallet || wallet.balance < booking_fee) {
        await Booking.updateStatus(booking_id, 'cancelled');
        await ParkingSpot.updateStatus(spot_id, 'available');
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }

      await Wallet.updateBalance(wallet.wallet_id, wallet.balance - booking_fee);
      await Transaction.create({
        wallet_id: wallet.wallet_id,
        booking_id,
        amount: booking_fee,
        transaction_type: 'booking_fee',
        payment_method,
        description: `Payment for booking ${booking_id}`
      });
      await Booking.updatePaymentStatus(booking_id, 'paid');
      await Booking.updateStatus(booking_id, 'confirmed');
    }

    await Notification.create({
      user_id: req.user.user_id,
      related_entity_id: booking_id,
      type: 'in_app',
      title: 'Booking Created',
      message: `Your booking for spot ${spot.spot_number} at ${garage.name} is ${payment_method === 'e_wallet' ? 'confirmed' : 'pending payment'}.`,
      related_entity: 'booking'
    });

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'Booking created',
      entity_type: 'booking',
      entity_id: booking_id,
      details: { garage_id, spot_id, payment_method }
    });

    res.status(201).json({ message: 'Booking created successfully', booking_id, qr_code });
  } catch (error) {
    throw error;
  }
};

const cancelBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findById(id);
    if (!booking || booking.customer_id !== req.user.user_id) {
      return res.status(400).json({ message: 'Booking not found or access denied' });
    }

    const garage = await Garage.findById(booking.garage_id);
    const is_cancelled_within_grace_period = (new Date() - new Date(booking.created_at)) / (1000 * 60) <= 15; // 15 minutes grace period
    const cancellation_fee = is_cancelled_within_grace_period ? 0 : garage.cancellation_fee;

    await Booking.cancel(id, cancellation_fee, is_cancelled_within_grace_period);
    await ParkingSpot.updateStatus(booking.spot_id, 'available');

    if (booking.payment_status === 'paid' && cancellation_fee < booking.booking_fee) {
      const wallet = await Wallet.findByUserAndGarage(req.user.user_id, booking.garage_id);
      await Wallet.updateBalance(wallet.wallet_id, wallet.balance + (booking.booking_fee - cancellation_fee));
      await Transaction.create({
        wallet_id: wallet.wallet_id,
        booking_id: id,
        amount: booking.booking_fee - cancellation_fee,
        transaction_type: 'refund',
        payment_method: 'e_wallet',
        description: `Refund for cancelled booking ${id}`
      });
    }

    await Notification.create({
      user_id: req.user.user_id,
      related_entity_id: id,
      type: 'in_app',
      title: 'Booking Cancelled',
      message: `Your booking at ${garage.name} has been cancelled. ${cancellation_fee > 0 ? `Cancellation fee: ${cancellation_fee}` : ''}`,
      related_entity: 'booking'
    });

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'Booking cancelled',
      entity_type: 'booking',
      entity_id: id,
      details: { cancellation_fee, is_cancelled_within_grace_period }
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    throw error;
  }
};

module.exports = { createBooking, cancelBooking };