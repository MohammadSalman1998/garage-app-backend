const pool = require('../config/database');

class Rating {
  static async create({ customer_id, garage_id, booking_id, rating, comment }) {
    const [result] = await pool.query(
      'INSERT INTO ratings (customer_id, garage_id, booking_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [customer_id, garage_id, booking_id || null, rating, comment]
    );
    return result.insertId;
  }

  static async getByGarageId(garage_id) {
    const [ratings] = await pool.query('SELECT * FROM ratings WHERE garage_id = ?', [garage_id]);
    return ratings;
  }
}

module.exports = Rating;