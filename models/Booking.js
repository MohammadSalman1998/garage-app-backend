const pool = require('../config/database');
const { generateQRCode } = require('../utils/qrCodeGenerator');

class Booking {
  static async create({ customer_id, garage_id, spot_id, booked_entry_time, booked_exit_time, booked_duration_hours, booking_fee, qr_code_identifier, qr_code_expiry }) {
    const [result] = await pool.query(
      'INSERT INTO bookings (customer_id, garage_id, spot_id, booked_entry_time, booked_exit_time, booked_duration_hours, booking_fee, qr_code_identifier, qr_code_expiry, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "pending_payment", NOW())',
      [customer_id, garage_id, spot_id, booked_entry_time, booked_exit_time, booked_duration_hours, booking_fee, qr_code_identifier, qr_code_expiry]
    );
    return result.insertId;
  }

  static async findById(booking_id) {
    const [bookings] = await pool.query('SELECT * FROM bookings WHERE booking_id = ?', [booking_id]);
    return bookings[0];
  }

  static async updateStatus(booking_id, status) {
    await pool.query('UPDATE bookings SET status = ? WHERE booking_id = ?', [status, booking_id]);
  }

  static async updatePaymentStatus(booking_id, payment_status) {
    await pool.query('UPDATE bookings SET payment_status = ? WHERE booking_id = ?', [payment_status, booking_id]);
  }

  static async cancel(booking_id, cancellation_fee, is_cancelled_within_grace_period) {
    await pool.query(
      'UPDATE bookings SET status = "cancelled", cancellation_fee = ?, is_cancelled_within_grace_period = ?, cancellation_time = NOW() WHERE booking_id = ?',
      [cancellation_fee, is_cancelled_within_grace_period, booking_id]
    );
  }
}

module.exports = Booking;