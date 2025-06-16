// const mysql = require('mysql2/promise');
// const dotenv = require('dotenv');

// // تحميل متغيرات البيئة
// dotenv.config();

// // إعداد الاتصال بقاعدة البيانات
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// // اختبار الاتصال
// async function testConnection() {
//     try {
//         const connection = await pool.getConnection();
//         console.log('تم الاتصال بقاعدة البيانات بنجاح!');
//         connection.release();
//     } catch (error) {
//         console.error('خطأ في الاتصال بقاعدة البيانات:', error);
//     }
// }

// testConnection();

// module.exports = pool;