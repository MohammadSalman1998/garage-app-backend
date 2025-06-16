const pool = require('../config/database');

class Garage {
  static async create({ manager_id, name, address, governorate, latitude, longitude, total_capacity, hourly_rate, floors_number, working_hours, cancellation_policy, min_booking_hours, cancellation_fee }) {
    const [result] = await pool.query(
      'INSERT INTO garages (manager_id, name, address, governorate, latitude, longitude, total_capacity, hourly_rate, floors_number, working_hours, cancellation_policy, min_booking_hours, cancellation_fee, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [manager_id, name, address, governorate, latitude, longitude, total_capacity, hourly_rate, floors_number, JSON.stringify(working_hours), cancellation_policy, min_booking_hours, cancellation_fee]
    );
    return result.insertId;
  }

  static async findById(garage_id) {
    const [garages] = await pool.query('SELECT * FROM garages WHERE garage_id = ? AND isActive = TRUE', [garage_id]);
    return garages[0];
  }

  static async getAll() {
    const [garages] = await pool.query('SELECT * FROM garages WHERE isActive = TRUE');
    return garages;
  }

  static async update(garage_id, updates) {
    const { name, address, governorate, latitude, longitude, total_capacity, hourly_rate, floors_number, working_hours, cancellation_policy, min_booking_hours, cancellation_fee } = updates;
    await pool.query(
      'UPDATE garages SET name = ?, address = ?, governorate = ?, latitude = ?, longitude = ?, total_capacity = ?, hourly_rate = ?, floors_number = ?, working_hours = ?, cancellation_policy = ?, min_booking_hours = ?, cancellation_fee = ? WHERE garage_id = ?',
      [name, address, governorate, latitude, longitude, total_capacity, hourly_rate, floors_number, JSON.stringify(working_hours), cancellation_policy, min_booking_hours, cancellation_fee, garage_id]
    );
  }

  static async delete(garage_id) {
    await pool.query('UPDATE garages SET isActive = FALSE WHERE garage_id = ?', [garage_id]);
  }
}

module.exports = Garage;