const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { 
        type: String, 
        enum: ['NEW_ASSIGNMENT', 'SLA_WARNING', 'ESCALATION_ALERT', 'STATUS_UPDATE', 'ADMIN_WARNING'],
        required: true 
    },
    message: { type: String, required: true },
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    isRead: { type: Boolean, default: false },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
