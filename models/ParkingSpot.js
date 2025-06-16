const pool = require('../config/database');

class ParkingSpot {
  static async create({ garage_id, floor_number, spot_number, spot_type, price_modifier }) {
    const [result] = await pool.query(
      'INSERT INTO parking_spots (garage_id, floor_number, spot_number, spot_type, price_modifier, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [garage_id, floor_number, spot_number, spot_type, price_modifier]
    );
    return result.insertId;
  }

  static async findById(parking_spot_id) {
    const [spots] = await pool.query('SELECT * FROM parking_spots WHERE parking_spot_id = ? AND is_active = TRUE', [parking_spot_id]);
    return spots[0];
  }

  static async getByGarageId(garage_id) {
    const [spots] = await pool.query('SELECT * FROM parking_spots WHERE garage_id = ? AND is_active = TRUE', [garage_id]);
    return spots;
  }

  static async updateStatus(parking_spot_id, status) {
    await pool.query('UPDATE parking_spots SET status = ?, last_booked_at = NOW() WHERE parking_spot_id = ?', [status, parking_spot_id]);
  }

  static async delete(parking_spot_id) {
    await pool.query('UPDATE parking_spots SET is_active = FALSE WHERE parking_spot_id = ?', [parking_spot_id]);
  }
}

module.exports = ParkingSpot;