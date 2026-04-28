const User = require('../models/User');
const notificationService = require('./notificationService');

const assignmentService = {
    /**
     * Assign a complaint to the best available officer in a department
     * Logic: Least-Load (Officer with lowest resolvedCount as proxy for current load)
     */
    assignToOfficer: async (complaint, departmentId) => {
        try {
            console.log(`[ASSIGNMENT] Initiating for Complaint ID: ${complaint._id}, Dept: ${departmentId}`);

            // 1. Find best officer in this specific department (Least-Load)
            let officer = await User.findOne({
                role: 'Officer',
                departmentId: departmentId,
                status: 'Active'
            }).sort({ resolvedCount: 1 });

            let assignmentReason = "Least-Load Dept Officer Match";

            // 2. Fallback: Any active officer in ANY department
            if (!officer) {
                console.log(`[ASSIGNMENT] No officer in dept ${departmentId}. Trying any active officer...`);
                officer = await User.findOne({
                    role: 'Officer',
                    status: 'Active'
                }).sort({ resolvedCount: 1 });
                assignmentReason = "Cross-Dept Fallback Officer";
            }

            // 3. Last resort: Admin
            if (!officer) {
                console.log(`[ASSIGNMENT] No active officers anywhere. Falling back to Admin...`);
                officer = await User.findOne({ role: 'Admin' });
                assignmentReason = "No Officers Available - Admin Fallback";
            }

            if (!officer) {
                console.error(`[CRITICAL] No Admin found in database. Assignment Failure.`);
                return null;
            }

            // 4. Update complaint
            complaint.assignedOfficerId = officer._id;
            if (complaint.status === 'NEW') {
                complaint.status = 'ASSIGNED';
            }

            // 5. Trigger notification
            await notificationService.send({
                recipientId: officer._id,
                type: 'NEW_ASSIGNMENT',
                message: `URGENT Assignment: #${complaint.ticketId} - Status UPDATED TO ASSIGNED.`,
                complaintId: complaint._id,
                priority: 'HIGH'
            });

            console.log(`[ASSIGNMENT SUCCESS] Ticket: ${complaint.ticketId} → ${officer.name} (${assignmentReason})`);
            return officer._id;

        } catch (error) {
            console.error('[ASSIGNMENT ERROR] Fatal failure during flow:', error);
            return null;
        }
    }
};

module.exports = assignmentService;
