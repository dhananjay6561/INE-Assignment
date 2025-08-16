const { Notification } = require('../models');

exports.listForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findAll({ where: { userId }, order: [['created_at', 'DESC']] });
    res.json({ notifications });
  } catch (err) {
    console.error('Failed to fetch notifications', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const notif = await Notification.findByPk(id);
    if (!notif || notif.userId !== userId) return res.status(404).json({ error: 'Notification not found' });
    notif.read = true;
    await notif.save();
    res.json({ message: 'Marked read' });
  } catch (err) {
    console.error('Failed to mark notification read', err);
    res.status(500).json({ error: 'Failed to mark notification' });
  }
};
