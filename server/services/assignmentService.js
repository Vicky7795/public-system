const User = require('../models/User');
const notificationService = require('./notificationService');

const assignmentService = {
    /**
     * Assign a complaint to the best available officer in a department
     * Logic: Least-Load (Officer with lowest activeCaseCount)
     */
    assignToOfficer: async (complaint, departmentId) => {
        try {
            // Find officers in this department, sorted by active cases
            const officer = await User.findOne({
                role: 'Officer',
                departmentId: departmentId
            }).sort({ activeCasesCount: 1 });

            if (!officer) {
                console.log(`[ASSIGNMENT] No officers found for department ${departmentId}`);
                return null;
            }

            // Update complaint
            complaint.assignedOfficerId = officer._id;
            complaint.status = 'Assigned';
            await complaint.save();

            // Update officer stats
            await User.findByIdAndUpdate(officer._id, { $inc: { activeCasesCount: 1 } });

            // Notify officer
            await notificationService.send({
                recipientId: officer._id,
                type: 'NEW_ASSIGNMENT',
                message: `New Grievance assigned: #${complaint.ticketId}. Please review immediately.`,
                complaintId: complaint._id,
                priority: 'MEDIUM'
            });

            console.log(`[ASSIGNMENT] Case #${complaint.ticketId} assigned to Officer ${officer.name}`);
            return officer._id;
        } catch (error) {
            console.error('Assignment Service Error:', error);
            return null;
        }
    }
};

module.exports = assignmentService;
