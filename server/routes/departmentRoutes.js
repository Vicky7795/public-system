const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const jwt = require('jsonwebtoken');

// Middleware to verify Admin
const adminAuth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'Admin') return res.status(403).json({ message: 'Access denied: Admins only' });
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

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
            const pending = await Complaint.countDocuments({ departmentId: dep._id, status: { $in: ['Pending', 'Assigned', 'In Progress'] } });
            const resolved = await Complaint.countDocuments({ departmentId: dep._id, status: 'Resolved' });

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

// Edit Department
router.patch('/:id', adminAuth, async (req, res) => {
    try {
        const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(department);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Department
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ message: 'Department deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
