// في backend/routes/contact.js
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { email, message } = req.body;
  // في هنا: منطق حفظ الرسالة أو إرسالها عبر nodemailer
  res.json({ message: 'تم إرسال الرسالة بنجاح' });
});

module.exports = router;