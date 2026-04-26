const User = require('../models/User');
const notificationService = require('./notificationService');

const assignmentService = {
    /**
     * Assign a complaint to the best available officer in a department
     * Logic: Least-Load (Officer with lowest activeCaseCount)
     */
    assignToOfficer: async (complaint, departmentId) => {
        try {
            console.log(`[ASSIGNMENT] Initiating for Complaint ID: ${complaint._id}, Dept: ${departmentId}`);
            
            // 1. Find best officer in this department (Least-Load)
            let officer = await User.findOne({
                role: 'Officer',
                departmentId: departmentId,
                status: 'Active'
            }).sort({ activeCasesCount: 1 });

            let assignmentReason = "Least-Load Officer Match";

            // 2. Admin Fallback - Ensure assignedTo != null
            if (!officer) {
                console.log(`[ASSIGNMENT] NO ACTIVE OFFICERS found for department. Cascading to Admin...`);
                officer = await User.findOne({ role: 'Admin' });
                assignmentReason = "No Available Dept Officer - Admin Fallback";
            }

            if (!officer) {
                console.error(`[CRITICAL] No fallback Admin found in database. Assignment Failure.`);
                return null;
            }

            // 3. Update Object Properties (DO NOT SAVE YET - calling route will handle persistence)
            complaint.assignedOfficerId = officer._id;
            complaint.status = 'ASSIGNED'; 

            // 4. Update stats for the assigned individual
            await User.findByIdAndUpdate(officer._id, { $inc: { activeCasesCount: 1 } });

            // 5. Trigger Notifications
            await notificationService.send({
                recipientId: officer._id,
                type: 'NEW_ASSIGNMENT',
                message: `URGENT Assignment: #${complaint.ticketId} - Status UPDATED TO ASSIGNED.`,
                complaintId: complaint._id,
                priority: 'HIGH'
            });

            console.log(`[ASSIGNMENT SUCCESS] ID: ${complaint._id}, Ticket: ${complaint.ticketId}`);
            console.log(`[DEBUG LOG] AssignedTo: ${officer.name} (${officer._id})`);
            console.log(`[DEBUG LOG] AssignmentReason: ${assignmentReason}`);
            
            return officer._id;
        } catch (error) {
            console.error('[ASSIGNMENT ERROR] Fatal failure during flow:', error);
            return null;
        }
    }
};

module.exports = assignmentService;
