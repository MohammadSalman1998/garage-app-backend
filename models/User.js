const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class User {
  // ===============================
  // Basic CRUD Operations
  // ===============================
  
  static async create({ full_name, username, password, email, phone, role }) {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, username, password_hash, email, phone, role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [full_name, username, password_hash, email, phone, role]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND isActive = TRUE', [email]);
    return users[0];
  }

  static async findByUsername(username) {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? AND isActive = TRUE', [username]);
    return users[0];
  }

  static async findById(user_id) {
    const [users] = await pool.query('SELECT * FROM users WHERE user_id = ? AND isActive = TRUE', [user_id]);
    return users[0];
  }

  static async findByIdwithoutCondition(user_id) {
    const [users] = await pool.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
    return users[0];
  }

  static async updateLastLogin(user_id) {
    await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user_id]);
  }

  static async update(user_id, updates) {
    const { email, phone, full_name, password, username } = updates;
    let query = 'UPDATE users SET email = ?, phone = ?, full_name = ?, username = ?, updated_at = NOW()';
    const values = [email, phone, full_name, username];

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      values.push(password_hash);
    }

    query += ' WHERE user_id = ?';
    values.push(user_id);

    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  }

  static async delete(user_id) {
    const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [user_id]);
    return result.affectedRows > 0;
  }

  static async disableUser(user_id) {
    const [result] = await pool.query('UPDATE users SET isActive = FALSE, updated_at = NOW() WHERE user_id = ?', [user_id]);
    return result.affectedRows > 0;
  }

   static async enableUser(user_id) {
    const [result] = await pool.query('UPDATE users SET isActive = TRUE, updated_at = NOW() WHERE user_id = ?', [user_id]);
    return result.affectedRows > 0;
  }

  static async restore(user_id) {
    const [result] = await pool.query('UPDATE users SET isActive = TRUE, updated_at = NOW() WHERE user_id = ?', [user_id]);
    return result.affectedRows > 0;
  }

  static async getAll(includeInactive = false) {
    let query = 'SELECT user_id, full_name, username, email, phone, role, isActive, total_loyalty_points, created_at, last_login FROM users';
    if (!includeInactive) {
      query += ' WHERE isActive = TRUE';
    }
    query += ' ORDER BY created_at DESC';
    
    const [users] = await pool.query(query);
    return users;
  }

  // ===============================
  // Password Reset Functionality
  // ===============================
  
  static async createPasswordResetToken(email) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    await pool.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE user_id = ?',
      [token, expires, user.user_id]
    );

    return token;
  }

  static async findByPasswordResetToken(token) {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW() AND isActive = TRUE',
      [token]
    );
    return users[0];
  }

  static async resetPassword(token, newPassword) {
    const user = await this.findByPasswordResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW() WHERE user_id = ?',
      [password_hash, user.user_id]
    );

    return true;
  }

  // ===============================
  // Authentication Methods
  // ===============================
  
  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static async changePassword(user_id, currentPassword, newPassword) {
    const user = await this.findById(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await this.validatePassword(user, currentPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',
      [password_hash, user_id]
    );

    return true;
  }

  // ===============================
  // Role Management
  // ===============================
  
  static async updateRole(user_id, newRole) {
    const validRoles = ['admin', 'garage_admin', 'employee', 'customer'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    const [result] = await pool.query(
      'UPDATE users SET role = ?, updated_at = NOW() WHERE user_id = ?',
      [newRole, user_id]
    );
    
    return result.affectedRows > 0;
  }

  static async getUsersByRole(role) {
    const [users] = await pool.query(
      'SELECT user_id, full_name, username, email, phone, role, created_at, last_login FROM users WHERE role = ? AND isActive = TRUE',
      [role]
    );
    return users;
  }

  // ===============================
  // Loyalty Points Management
  // ===============================
  
  static async updateLoyaltyPoints(user_id, points) {
    const [result] = await pool.query(
      'UPDATE users SET total_loyalty_points = total_loyalty_points + ?, updated_at = NOW() WHERE user_id = ?',
      [points, user_id]
    );
    return result.affectedRows > 0;
  }

  static async getLoyaltyPoints(user_id) {
    const [users] = await pool.query(
      'SELECT total_loyalty_points FROM users WHERE user_id = ? AND isActive = TRUE',
      [user_id]
    );
    return users[0]?.total_loyalty_points || 0;
  }

  static async resetLoyaltyPoints(user_id) {
    const [result] = await pool.query(
      'UPDATE users SET total_loyalty_points = 0, updated_at = NOW() WHERE user_id = ?',
      [user_id]
    );
    return result.affectedRows > 0;
  }

  // ===============================
  // Advanced Query Methods
  // ===============================
  
  static async findByPhoneNumber(phone) {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE phone = ? AND isActive = TRUE',
      [phone]
    );
    return users[0];
  }

  static async searchUsers(searchTerm, role = null) {
    let query = `
      SELECT user_id, full_name, username, email, phone, role, created_at, last_login 
      FROM users 
      WHERE isActive = TRUE 
      AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)
    `;
    let params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY full_name ASC';

    const [users] = await pool.query(query, params);
    return users;
  }

  static async getUserStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN isActive = TRUE THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN role = 'garage_admin' THEN 1 ELSE 0 END) as garage_admins,
        SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employees,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as active_last_30_days
      FROM users
    `);
    return stats[0];
  }

  static async getRecentUsers(limit = 10) {
    const [users] = await pool.query(
      'SELECT user_id, full_name, username, email, role, created_at FROM users WHERE isActive = TRUE ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return users;
  }

  // ===============================
  // Validation Methods
  // ===============================
  
  static async isEmailExists(email, excludeUserId = null) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    let params = [email];

    if (excludeUserId) {
      query += ' AND user_id != ?';
      params.push(excludeUserId);
    }

    const [result] = await pool.query(query, params);
    return result[0].count > 0;
  }

  static async isUsernameExists(username, excludeUserId = null) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    let params = [username];

    if (excludeUserId) {
      query += ' AND user_id != ?';
      params.push(excludeUserId);
    }

    const [result] = await pool.query(query, params);
    return result[0].count > 0;
  }

  static async isPhoneExists(phone, excludeUserId = null) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE phone = ?';
    let params = [phone];

    if (excludeUserId) {
      query += ' AND user_id != ?';
      params.push(excludeUserId);
    }

    const [result] = await pool.query(query, params);
    return result[0].count > 0;
  }

  // ===============================
  // Activity Tracking
  // ===============================
  
  static async getActiveUsers(days = 30) {
    const [users] = await pool.query(
      'SELECT user_id, full_name, username, email, role, last_login FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL ? DAY) AND isActive = TRUE ORDER BY last_login DESC',
      [days]
    );
    return users;
  }

  static async getInactiveUsers(days = 90) {
    const [users] = await pool.query(
      'SELECT user_id, full_name, username, email, role, last_login FROM users WHERE (last_login IS NULL OR last_login < DATE_SUB(NOW(), INTERVAL ? DAY)) AND isActive = TRUE ORDER BY created_at DESC',
      [days]
    );
    return users;
  }

  // ===============================
  // Bulk Operations
  // ===============================
  
  static async bulkCreate(usersData) {
    const results = [];
    
    for (const userData of usersData) {
      try {
        const userId = await this.create(userData);
        results.push({ success: true, userId, email: userData.email });
      } catch (error) {
        results.push({ success: false, email: userData.email, error: error.message });
      }
    }
    
    return results;
  }

  static async bulkUpdateStatus(userIds, isActive) {
    const placeholders = userIds.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE users SET isActive = ?, updated_at = NOW() WHERE user_id IN (${placeholders})`,
      [isActive, ...userIds]
    );
    return result.affectedRows;
  }

  // ===============================
  // Profile Management
  // ===============================
  
  static async getProfile(user_id) {
    const [users] = await pool.query(
      'SELECT user_id, full_name, username, email, phone, role, total_loyalty_points, created_at, last_login FROM users WHERE user_id = ? AND isActive = TRUE',
      [user_id]
    );
    return users[0];
  }

  static async updateProfile(user_id, profileData) {
    const { full_name, phone } = profileData;
    const [result] = await pool.query(
      'UPDATE users SET full_name = ?, phone = ?, updated_at = NOW() WHERE user_id = ?',
      [full_name, phone, user_id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;
