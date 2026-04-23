const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const jwt = require('jsonwebtoken');

// Middleware to verify Admin
const { adminAuth } = require('../middleware/auth');

// Create Department
router.post('/', adminAuth, async (req, res) => {
    try {
        const { departmentName, description, slaHours } = req.body;
        const department = new Department({ departmentName, description, slaHours });
        await department.save();
        res.json(department);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Departments with Stats
router.get('/', async (req, res) => {
    try {
        const departments = await Department.find();
        const depsWithStats = await Promise.all(departments.map(async (dep) => {
            const total = await Complaint.countDocuments({ departmentId: dep._id });
            const pending = await Complaint.countDocuments({ departmentId: dep._id, status: { $in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED', 'OVERDUE', 'ESCALATED'] } });
            const resolved = await Complaint.countDocuments({ departmentId: dep._id, status: 'RESOLVED' });

            // Basic SLA performance calculation
            return {
                ...dep.toObject(),
                totalComplaints: total,
                pending,
                resolved,
                slaPerformance: total > 0 ? Math.round((resolved / total) * 100) : 100
            };
        }));
        res.json(depsWithStats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Single Department
router.get('/:id', async (req, res) => {
    const rawId = req.params.id;
    try {
        const cleanId = rawId.split(':')[0].trim();
        console.log(`[GET] Department Request - Raw: "${rawId}", Clean: "${cleanId}"`);
        
        const department = await Department.findById(cleanId);
        if (!department) {
            console.warn(`[GET] Department NOT FOUND: ${cleanId}`);
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json(department);
    } catch (err) {
        console.error(`[GET] Department Error:`, err.message);
        res.status(400).json({ 
            message: 'Invalid ID or Processing Error', 
            receivedId: rawId,
            error: err.message 
        });
    }
});

// Edit Department
router.patch('/:id', adminAuth, async (req, res) => {
    try {
        const cleanId = req.params.id.split(':')[0].trim();
        const department = await Department.findByIdAndUpdate(cleanId, req.body, { new: true });
        res.json(department);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Department
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const depId = req.params.id.split(':')[0].trim();
        
        // 1. Check for active complaints in this department
        const complaintCount = await Complaint.countDocuments({ departmentId: depId });
        if (complaintCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete department: ${complaintCount} grievances are currently associated with it. Please reassign them first.` 
            });
        }

        // 2. Check for officers assigned to this department
        const User = require('../models/User');
        const officerCount = await User.countDocuments({ departmentId: depId, role: 'Officer' });
        if (officerCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete department: ${officerCount} officers are still assigned to it. Please update their department first.` 
            });
        }

        await Department.findByIdAndDelete(depId);
        res.json({ message: 'Department successfully removed.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
