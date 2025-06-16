const pool = require('../config/database');

class GarageImage {
  static async create({ garage_id, image_url }) {
    const [result] = await pool.query(
      'INSERT INTO garage_images (garage_id, image_url, created_at) VALUES (?, ?, NOW())',
      [garage_id, image_url]
    );
    return result.insertId;
  }

  static async getByGarageId(garage_id) {
    const [images] = await pool.query('SELECT * FROM garage_images WHERE garage_id = ?', [garage_id]);
    return images;
  }

  static async delete(image_id) {
    await pool.query('DELETE FROM garage_images WHERE image_id = ?', [image_id]);
  }
}

module.exports = GarageImage;