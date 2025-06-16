const pool = require('../config/database');

class Notification {
  static async create({ user_id, related_entity_id, type, title, message, related_entity }) {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, related_entity_id, type, title, message, related_entity, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [user_id, related_entity_id, type, title, message, related_entity]
    );
    return result.insertId;
  }

  static async getByUserId(user_id) {
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return notifications;
  }

  static async updateStatus(notification_id, status) {
    await pool.query('UPDATE notifications SET status = ? WHERE id = ?', [status, notification_id]);
  }
}

module.exports = Notification;