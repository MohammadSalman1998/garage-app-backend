const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWelcomeEmail = async (to, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'مرحباً بكم في منصة مواقف السيارات!',
    html: `<h1>مرحباً, ${name}!</h1><p>شكرًا لانضمامك إلى منصتنا. ابدأ بحجز مواقف سيارتك الآن.!</p>`,
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmailToGarageAdmin = async (to, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'مرحباً بكم في منصة مواقف السيارات!',
    html: `<h1>مرحباً, ${name}!</h1><p>لقد تم انشاء حساب خاص بك بصفة مسؤول مرآب.!</p>`,
  };

  await transporter.sendMail(mailOptions);
}

const sendWelcomeEmailToEmployee = async (to, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'مرحباً بكم في منصة مواقف السيارات!',
    html: `<h1>مرحباً, ${name}!</h1><p>لقد تم انشاء حساب خاص بك بصفة موظف مرآب.!</p>`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendWelcomeEmail, sendWelcomeEmailToGarageAdmin, sendWelcomeEmailToEmployee };