const pool = require('../config/database');

class GarageEmployee {
  static async create({ user_id, garage_id, role, start_date }) {
    const [result] = await pool.query(
      'INSERT INTO garage_employees (user_id, garage_id, role, start_date, created_at) VALUES (?, ?, ?, ?, NOW())',
      [user_id, garage_id, role, start_date]
    );
    return result.insertId;
  }

  static async getByGarageId(garage_id) {
    const [employees] = await pool.query('SELECT * FROM garage_employees WHERE garage_id = ? AND is_active = TRUE', [garage_id]);
    return employees;
  }

  static async delete(garage_employe_id) {
    await pool.query('UPDATE garage_employees SET is_active = FALSE WHERE garage_employe_id = ?', [garage_employe_id]);
  }
}

module.exports = GarageEmployee;