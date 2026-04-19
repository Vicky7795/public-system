const Notification = require('../models/Notification');
const User = require('../models/User');

const notificationService = {
    /**
     * Send a notification to a user
     */
    send: async ({ recipientId, type, message, complaintId, priority = 'LOW' }) => {
        try {
            const notification = new Notification({
                recipientId,
                type,
                message,
                complaintId,
                priority
            });
            await notification.save();

            // Increment unread count on user
            await User.findByIdAndUpdate(recipientId, { $inc: { unreadNotifications: 1 } });

            console.log(`[NOTIFICATION] [${type}] To ${recipientId}: ${message}`);
            return notification;
        } catch (error) {
            console.error('Notification Error:', error);
        }
    },

    /**
     * Mark all notifications as read for a user
     */
    markAllRead: async (userId) => {
        await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
        await User.findByIdAndUpdate(userId, { unreadNotifications: 0 });
    }
};

module.exports = notificationService;
