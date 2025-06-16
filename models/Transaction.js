const pool = require('../config/database');

class Transaction {
  static async create({ wallet_id, booking_id, amount, transaction_type, payment_method, description }) {
    const [result] = await pool.query(
      'INSERT INTO transactions (wallet_id, booking_id, amount, transaction_type, payment_method, description, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [wallet_id, booking_id || null, amount, transaction_type, payment_method, description]
    );
    return result.insertId;
  }

  static async updateStatus(transaction_id, status) {
    await pool.query('UPDATE transactions SET status = ? WHERE transaction_id = ?', [status, transaction_id]);
  }
}

module.exports = Transaction;