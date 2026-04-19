const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const notificationService = require('./notificationService');

const automationService = {
    init: () => {
        console.log('[SLA MONITOR] Initializing background automation tasks...');
        
        // Run every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            console.log('[SLA MONITOR] Checking for deadline breaches...');
            await automationService.checkSLA();
        });
    },

    checkSLA: async () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        try {
            // 1. Find complaints that are overdue but not yet marked
            const breachCases = await Complaint.find({
                status: { $in: ['Assigned', 'In Progress', 'Pending', 'Reopened', 'Overdue'] },
                slaDeadline: { $lt: now }
            });

            for (const c of breachCases) {
                // If it's already "Overdue" but older than 24h, mark as "Escalated"
                if (c.status === 'Overdue' && c.slaDeadline < yesterday) {
                    c.status = 'Escalated';
                    await c.save();

                    // Update officer escalated count
                    if (c.assignedOfficerId) {
                        await User.findByIdAndUpdate(c.assignedOfficerId, { $inc: { escalatedCount: 1 } });
                    }

                    // Notify Admin & Citizen
                    await notificationService.send({
                        recipientId: c.userId,
                        type: 'ESCALATION_ALERT',
                        message: `Case #${c.ticketId} has been escalated to senior management due to delay.`,
                        complaintId: c._id,
                        priority: 'HIGH'
                    });

                    // Notify Admin (Assume we have a way to find first admin or notify all)
                    const admin = await User.findOne({ role: 'Admin' });
                    if (admin) {
                        await notificationService.send({
                            recipientId: admin._id,
                            type: 'ESCALATION_ALERT',
                            message: `ALERT: Critical SLA Breach on #${c.ticketId}. Status: ESCALATED.`,
                            complaintId: c._id,
                            priority: 'HIGH'
                        });
                    }
                    continue;
                }

                // Initial transition to Overdue
                if (c.status !== 'Overdue' && c.status !== 'Escalated') {
                    c.status = 'Overdue';
                    await c.save();

                    if (c.assignedOfficerId) {
                        await User.findByIdAndUpdate(c.assignedOfficerId, { $inc: { overdueCount: 1 } });

                        // Warning to Officer
                        await notificationService.send({
                            recipientId: c.assignedOfficerId,
                            type: 'SLA_WARNING',
                            message: `URGENT: SLA expired for #${c.ticketId}. Mark as In-Progress or Resolve immediately.`,
                            complaintId: c._id,
                            priority: 'HIGH'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[SLA MONITOR] Check Error:', error);
        }
    }
};

module.exports = automationService;
