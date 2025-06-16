const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { sendWelcomeEmail } = require('../config/mailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * @desc register a new customer account, and send welcome notification and email to new customer, and record register log
 * @route ~/api/auth/register
 * @method POST
 * @body full_name, username, password, email, phone
 * @params no params
 * @type JSON
 * @access public
 */
const register = async (req, res) => {
  const { full_name, username, password, email, phone } = req.body;

  if (!full_name || !username || !password || !email || !phone) {
    return res.status(400).json({ message: 'يجب إدخال جميع البيانات' });
  }

  const role = 'customer';

  try {
    const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني أو اسم المستخدم موجود بالفعل' });
    }

    const user_id = await User.create({ full_name, username, password, email, phone, role });

    const token = jwt.sign(
      { user_id, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await Notification.create({
      user_id,
      related_entity_id: user_id,
      type: 'in_app',
      title: 'مرحباً بكم في منصة مواقف السيارات',
      message: `مرحباً, ${full_name}! لقد تم إنشاء حسابك.`,
      related_entity: 'register'
    });

    await sendWelcomeEmail(email, full_name);

    await AuditLog.create({
      user_id,
      action: 'تسجيل حساب مستخدم',
      entity_type: 'user',
      entity_id: user_id,
      details: { email, username }
    });

    res.status(201).json({ message: 'تم تسجيل المستخدم بنجاح', token, data: {user_id, full_name, username, email, phone, role } });
  } catch (error) {
    throw error;
  }
};

/**
 * @desc login to app, and record login log, and update last login date
 * @route ~/api/auth/login
 * @method POST
 * @body  email, password
 * @params no params
 * @type JSON
 * @access public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if(!password || !email){
    return res.status(400).json({ message: 'يجب إدخال جميع البيانات' });
  }

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'الأيميل أو كلمة المرور غير صحيحة' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'لقد تم تعطيل حسابك، الرجاء التواصل مع فريق الدعم' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'الأيميل أو كلمة المرور غير صحيحة' });
    }

    await User.updateLastLogin(user.user_id);

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role, isActive: user.isActive },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await AuditLog.create({
      user_id: user.user_id,
      action: 'تسجيل دخول مستخدم',
      entity_type: 'user',
      entity_id: user.user_id,
      details: { email }
    });

    res.json({
      token,
      data: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    throw error;
  }
};

module.exports = { register, login };