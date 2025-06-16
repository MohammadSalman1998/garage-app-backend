const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.getByUserId(req.user.user_id);
    res.json(notifications);
  } catch (error) {
    throw error;
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    await Notification.updateStatus(id, 'read');
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    throw error;
  }
};

module.exports = { getNotifications, markAsRead };