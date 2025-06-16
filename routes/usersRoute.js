const express = require('express');
const { 
  createGarageAdmin, 
  createEmployee, 
  getUsers, 
  getUserById,
  updateUser, 
  deleteUser,
  getUserStats,
  changePassword,
  updateUserRole,
  toggleActivateUser
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// إنشاء الحسابات
router.post('/garage-admin', authenticate, authorize(['admin']), createGarageAdmin);
router.post('/employee', authenticate, authorize(['garage_admin']), createEmployee);

// جلب المستخدمين
router.get('/', authenticate, authorize(['admin']), getUsers);
router.get('/stats', authenticate, authorize(['admin']), getUserStats);
router.get('/:id', authenticate, getUserById);

// تحديث المستخدمين
router.put('/:id', authenticate, updateUser);
router.put('/:id/toggleActive', authenticate, toggleActivateUser);
router.put('/:id/role', authenticate, authorize(['admin']), updateUserRole);
router.post('/:id/change-password', authenticate, changePassword);

// حذف المستخدمين
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);

module.exports = router;