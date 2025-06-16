const pool = require('../config/database');

class AuditLog {
  static async create({ user_id, action, entity_type, entity_id, details }) {
    const [result] = await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [user_id || null, action, entity_type, entity_id || null, JSON.stringify(details)]
    );
    return result.insertId;
  }
}

module.exports = AuditLog;