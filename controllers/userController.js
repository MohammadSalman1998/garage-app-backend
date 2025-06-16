const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const GarageEmployee = require('../models/GarageEmployee'); // مفقود في الكود الأصلي
const { sendWelcomeEmailToGarageAdmin, sendWelcomeEmailToEmployee } = require('../config/mailer');
const Garage = require('../models/Garage');



// create a folder (garage_app)
//  npm create vite@latest
// React
// javascript
// cd ....
// npm i
// npm run dev
// -------> tailwindCss <-------
// src/components/
//                --> Button
//                --> Input
//                --> Select_Input
//                --> TextArea
//                --> form
//                --> ul/navs
//                --> Hedear
//                --> Footer
//                --> Hero
// src/pages/
//           --> login ( email - password)
//           --> register (full_name, username, password, email, phone)
// call all pages in app.jsx
// ==> 200/201 = > page (Welcome ...)
// ==> Alert()
// --> token ----> localStorage
// role ==> customer => page (welcome customer)
// role ==> admin => page (welcome admin)
// role ==> garage-admin => page (welcome garage-admin)
// role ==> employee => page (welcome employee)

//axios -> fetch

/**
 * @desc create a new garage-admin account, and send welcome notification and email to new garage admin, and record register log
 * @route ~/api/users/garage-admin
 * @method POST
 * @body  full_name, username, password, email, phone
 * @params  no params
 * @type  JSON
 * @access private (admin)
 */
const createGarageAdmin = async (req, res) => {
  const { full_name, username, password, email, phone } = req.body;

  if (!full_name || !username || !password || !email || !phone) {
    return res.status(400).json({ message: 'يجب إدخال جميع البيانات' });
  }

  try {
    // التحقق من وجود البريد الإلكتروني واسم المستخدم والهاتف
    const emailExists = await User.isEmailExists(email);
    const usernameExists = await User.isUsernameExists(username);
    const phoneExists = await User.isPhoneExists(phone);

    if (emailExists || usernameExists || phoneExists) {
      return res.status(400).json({
        message: 'البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف موجود بالفعل'
      });
    }

    const user_id = await User.create({ full_name, username, password, email, phone, role: 'garage_admin' });

    await Notification.create({
      user_id,
      related_entity_id: user_id,
      type: 'in_app',
      title: 'مرحباً بكم في منصة مواقف السيارات',
      message: `مرحباً, ${full_name}! أنت الآن مسؤول المرآب.`,
      related_entity: 'register'
    });

    // إضافة try-catch للبريد الإلكتروني
    try {
      await sendWelcomeEmailToGarageAdmin(email, full_name);
    } catch (emailError) {
      console.error('خطأ في إرسال البريد الإلكتروني:', emailError);
      // لا نوقف العملية إذا فشل إرسال البريد
    }

    await AuditLog.create({
      user_id: req.user.user_id, // يجب أن يكون المستخدم الذي أنشأ الحساب وليس الحساب الجديد
      action: 'إنشاء حساب مدير مرآب',
      entity_type: 'garage_admin',
      entity_id: user_id,
      details: { email, username, created_by: req.user.user_id }
    });

    res.status(201).json({
      message: 'تم إنشاء حساب مدير مرآب بنجاح',
      user_id: user_id
    });
  } catch (error) {
    console.error('خطأ في إنشاء مدير المرآب:', error);
    res.status(500).json({ message: 'حدث خطأ في إنشاء الحساب' });
  }
};

/**
 * @desc create a new Employee account, and send welcome notification and email to new Employee, and record register log
 * @route ~/api/users/employee
 * @method POST
 * @body  full_name, username, password, email, phone, garage_id, role
 * @params  no params
 * @type  JSON
 * @access private (garage_admin)
 */
const createEmployee = async (req, res) => {
  const { full_name, username, password, email, phone, garage_id, role = 'scanner' } = req.body;
  const garageAdminID = req.user.user_id;

  if (!full_name || !username || !password || !email || !phone || !garage_id) {
    return res.status(400).json({ message: 'يجب إدخال جميع البيانات' });
  }

  // التحقق من صحة دور الموظف
  const validEmployeeRoles = ['supervisor', 'scanner'];
  if (!validEmployeeRoles.includes(role)) {
    return res.status(400).json({ message: 'دور الموظف غير صحيح' });
  }

  try {
    const garage = await Garage.findById(garage_id);
    if (!garage || garage.manager_id != garageAdminID) {
      return res.status(403).json({ message: 'ليس مخول إضافة موظف إلا للمرآب الخاص بك' });
    }

    // التحقق من وجود البريد الإلكتروني واسم المستخدم والهاتف
    const emailExists = await User.isEmailExists(email);
    const usernameExists = await User.isUsernameExists(username);
    const phoneExists = await User.isPhoneExists(phone);

    if (emailExists || usernameExists || phoneExists) {
      return res.status(400).json({
        message: 'البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف موجود بالفعل'
      });
    }

    const user_id = await User.create({ full_name, username, password, email, phone, role: 'employee' });

    await Notification.create({
      user_id,
      related_entity_id: user_id,
      type: 'in_app',
      title: 'مرحباً بكم في منصة مواقف السيارات',
      message: `مرحباً, ${full_name}! أنت الآن موظف جديد في مرآب ${garage.name}.`,
      related_entity: 'register'
    });

    // إضافة try-catch للبريد الإلكتروني
    try {
      await sendWelcomeEmailToEmployee(email, full_name);
    } catch (emailError) {
      console.error('خطأ في إرسال البريد الإلكتروني:', emailError);
    }

    await GarageEmployee.create({
      user_id,
      garage_id,
      role,
      start_date: new Date()
    });

    await AuditLog.create({
      user_id: req.user.user_id, // يجب أن يكون مدير المرآب الذي أنشأ الحساب
      action: 'إنشاء حساب موظف مرآب',
      entity_type: 'employee',
      entity_id: user_id,
      details: { email, username, garage_id, employee_role: role, created_by: req.user.user_id }
    });

    res.status(201).json({
      message: 'تم إنشاء حساب الموظف بنجاح',
      data: user_id
    });
  } catch (error) {
    console.error('خطأ في إنشاء الموظف:', error);
    res.status(500).json({ message: 'حدث خطأ في إنشاء الحساب' });
  }
};

/**
 * @desc Get all users with optional filtering
 * @route ~/api/users
 * @method GET
 * @query role, search, page, limit
 * @access private (admin)
 */
const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    let users;

    if (search) {
      users = await User.searchUsers(search, role);
    } else if (role) {
      users = await User.getUsersByRole(role);
    } else {
      users = await User.getAll();
    }

    // تطبيق التصفح (pagination)
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      totalUsers: users.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(users.length / limit)
    });
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({ message: 'حدث خطأ في جلب المستخدمين' });
  }
};

/**
 * @desc Get user by ID
 * @route ~/api/users/:id
 * @method GET
 * @access private (admin or own profile)
 */
const getUserById = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin' && req.user.user_id !== parseInt(id)) {
    return res.status(403).json({ message: 'غير مخول للوصول لهذه البيانات' });
  }

  try {
    const user = await User.getProfile(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    res.status(500).json({ message: 'حدث خطأ في جلب البيانات' });
  }
};

/**
 * @desc Update user information
 * @route ~/api/users/:id
 * @method PUT
 * @access private (admin or own profile)
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  let { email, phone, full_name, password, username } = req.body;

  if (req.user.role !== 'admin' && req.user.user_id !== parseInt(id)) {
    return res.status(403).json({ message: 'غير مخول لتعديل هذه البيانات' });
  }

  try {
    // التحقق من وجود المستخدم
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const oldEmail = existingUser.email
    const oldPhone = existingUser.phone
    const oldUserName = existingUser.username
    const oldFullName = existingUser.full_name

    if (!email) { email = oldEmail }
    if (!phone) { phone = oldPhone }
    if (!full_name) { full_name = oldFullName }
    if (!username) { username = oldUserName }

    // التحقق من عدم تكرار البيانات
    // if (email && await User.isEmailExists(email, id)) {
    //   return res.status(400).json({ message: 'البريد الإلكتروني موجود بالفعل' });
    // }

    // if (username && await User.isUsernameExists(username, id)) {
    //   return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
    // }

    // if (phone && await User.isPhoneExists(phone, id)) {
    //   return res.status(400).json({ message: 'رقم الهاتف موجود بالفعل' });
    // }

    const updated = await User.update(id, { email, phone, full_name, password, username });

    if (!updated) {
      return res.status(500).json({ message: 'فشل في تحديث البيانات' });
    }

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'تحديث بيانات المستخدم',
      entity_type: 'user',
      entity_id: id,
      details: { email, username, updated_by: req.user.user_id }
    });

    res.json({ message: 'تم تحديث البيانات بنجاح', user: { id, email, phone, full_name, username } });
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    res.status(500).json({ message: 'حدث خطأ في تحديث البيانات' });
  }
};

/**
 * @desc Delete user 
 * @route ~/api/users/:id
 * @method DELETE
 * @access private (admin)
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const deleted = await User.delete(id);

    if (!deleted) {
      return res.status(500).json({ message: 'فشل في حذف المستخدم' });
    }

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'حذف المستخدم',
      entity_type: 'user',
      entity_id: id,
      details: { deleted_user_email: user.email, deleted_by: req.user.user_id }
    });

    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    res.status(500).json({ message: 'حدث خطأ في حذف المستخدم' });
  }
};

/**
 * @desc Get user statistics
 * @route ~/api/users/stats
 * @method GET
 * @access private (admin)
 */
const getUserStats = async (req, res) => {
  try {
    const stats = await User.getUserStats();
    res.json(stats);
  } catch (error) {
    console.error('خطأ في جلب إحصائيات المستخدمين:', error);
    res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات' });
  }
};

/**
 * @desc Change user password
 * @route ~/api/users/:id/change-password
 * @method POST
 * @access private (admin or own profile)
 */
const changePassword = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (req.user.role !== 'admin' && req.user.user_id !== parseInt(id)) {
    return res.status(403).json({ message: 'غير مخول لتغيير كلمة المرور' });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'يجب إدخال كلمة المرور الحالية والجديدة' });
  }

  try {
    await User.changePassword(id, currentPassword, newPassword);

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'تغيير كلمة المرور',
      entity_type: 'user',
      entity_id: id,
      details: { changed_by: req.user.user_id }
    });

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }
    console.error('خطأ في تغيير كلمة المرور:', error);
    res.status(500).json({ message: 'حدث خطأ في تغيير كلمة المرور' });
  }
};

/**
 * @desc Update user role
 * @route ~/api/users/:id/role
 * @method PUT
 * @access private (admin)
 */
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ message: 'يجب تحديد الدور الجديد' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const updated = await User.updateRole(id, role);

    if (!updated) {
      return res.status(500).json({ message: 'فشل في تحديث الدور' });
    }

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'تحديث دور المستخدم',
      entity_type: 'user',
      entity_id: id,
      details: {
        old_role: user.role,
        new_role: role,
        updated_by: req.user.user_id
      }
    });

    res.json({ message: 'تم تحديث الدور بنجاح' });
  } catch (error) {
    if (error.message === 'Invalid role') {
      return res.status(400).json({ message: 'الدور المحدد غير صحيح' });
    }
    console.error('خطأ في تحديث الدور:', error);
    res.status(500).json({ message: 'حدث خطأ في تحديث الدور' });
  }
};


/**
 * @desc toggle activate user
 * @route ~/api/users/:id/toggleActive
 * @method PUT
 * @access private (admin)
 */
const toggleActivateUser = async (req, res) => {

  const { id } = req.params;

  try {
    const user = await User.findByIdwithoutCondition(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    let action
    let message
    if (user.isActive) {
      action = "تعطيل حساب المستخدم"
      message = "تم تعطيل حساب المستخدم"
      const disableUser = await User.disableUser(id)

      if (!disableUser) {
        return res.status(500).json({ message: 'فشل في تعطيل الحساب' });
      }
    }

    if (!user.isActive) {
      action = "تفعيل حساب المستخدم"
      message = "تم تفعيل حساب المستخدم"
      const enableUser = await User.enableUser(id)

      if (!enableUser) {
        return res.status(500).json({ message: 'فشل في تفعيل الحساب' });
      }
    }


    await AuditLog.create({
      user_id: req.user.user_id,
      action,
      entity_type: 'user',
      entity_id: id,
      details: {
        Old_isActive: user.isActive,
        updated_by: req.user.user_id
      }
    });

    res.json({ message });
  } catch (error) {
    console.error('خطأ في تفعيل/تعطيل الحساب:', error);
    res.status(500).json({ message: 'حدث خطأ في تفعيل/تعطيل الحساب' });
  }
};




module.exports = {
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
};
