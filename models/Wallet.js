const pool = require('../config/database');

class Wallet {
  static async create({ user_id, garage_id, currency }) {
    const [result] = await pool.query(
      'INSERT INTO wallets (user_id, garage_id, currency, created_at) VALUES (?, ?, ?, NOW())',
      [user_id, garage_id, currency]
    );
    return result.insertId;
  }

  static async findByUserAndGarage(user_id, garage_id) {
    const [wallets] = await pool.query('SELECT * FROM wallets WHERE user_id = ? AND garage_id = ? AND isActive = TRUE', [user_id, garage_id]);
    return wallets[0];
  }

  static async updateBalance(wallet_id, balance) {
    await pool.query('UPDATE wallets SET balance = ? WHERE wallet_id = ?', [balance, wallet_id]);
  }
}

module.exports = Wallet;