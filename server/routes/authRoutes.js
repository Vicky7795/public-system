const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, phone, email, password, role, departmentId, assignedArea } = req.body;
        const normalizedEmail = email?.toLowerCase().trim();
        if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });

        const normalizedPhone = phone?.toString().trim();
        if (!normalizedPhone) return res.status(400).json({ message: 'Phone number is required' });

        // 1. Check if email exists
        let user = await User.findOne({ email: normalizedEmail });
        if (user) return res.status(400).json({ message: 'User already exists with this email' });

        // 2. Check if phone exists (to avoid relying solely on catch block for common errors)
        const existingPhone = await User.findOne({ phone: normalizedPhone });
        if (existingPhone) return res.status(400).json({ message: 'User already exists with this phone number' });

        const userData = {
            name,
            phone: normalizedPhone,
            email: normalizedEmail,
            password: bcrypt.hashSync(password, 10),
            role
        };

        if (role === 'Officer') {
            userData.departmentId = departmentId;
            userData.assignedArea = assignedArea;
        }

        user = new User(userData);
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role, departmentId: user.departmentId }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user._id, name, role: user.role, departmentId: user.departmentId } });
    } catch (err) {
        console.error('Registration Error:', err);
        if (err.code === 11000) {
            const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
            return res.status(400).json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please use another or login.` });
        }
        res.status(500).json({ message: err.message || 'Server error during registration' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role, departmentId: user.departmentId }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user._id, name: user.name, role: user.role, departmentId: user.departmentId } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all Officers (for Admin Management)
router.get('/officers', async (req, res) => {
    try {
        const officers = await User.find({ role: 'Officer' }, 'name email phone departmentId assignedArea').populate('departmentId', 'departmentName');
        res.json(officers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Officer
router.patch('/officers/:id', async (req, res) => {
    try {
        const { name, email, phone, departmentId, assignedArea } = req.body;
        const officer = await User.findById(req.params.id);
        if (!officer || officer.role !== 'Officer') return res.status(404).json({ message: 'Officer not found' });

        if (name) officer.name = name;
        if (email) officer.email = email;
        if (phone) officer.phone = phone;
        if (departmentId) officer.departmentId = departmentId;
        if (assignedArea) officer.assignedArea = assignedArea;

        await officer.save();
        res.json({ message: 'Officer updated successfully', officer });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Officer
router.delete('/officers/:id', async (req, res) => {
    try {
        const officer = await User.findById(req.params.id);
        if (!officer || officer.role !== 'Officer') return res.status(404).json({ message: 'Officer not found' });

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Officer deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reset Password (Verify by Email + Phone)
router.post('/reset-password', async (req, res) => {
    try {
        const { email, phone, newPassword } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const normalizedPhone = phone?.toString().trim();
        if (!normalizedPhone) return res.status(400).json({ message: 'Phone number is required' });

        // 1. Verify user exists with this email and phone
        const user = await User.findOne({ email: normalizedEmail, phone: normalizedPhone });
        if (!user) {
            return res.status(404).json({ message: 'User not found with these details.' });
        }

        // 2. Hash and Save new password
        user.password = bcrypt.hashSync(newPassword, 10);
        await user.save();

        res.json({ message: 'Password reset successful. You can now login.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Google Sign-In
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { email, name, sub: googleId } = ticket.getPayload();
        const normalizedEmail = email.toLowerCase().trim();

        let user = await User.findOne({
            $or: [{ googleId }, { email: normalizedEmail }]
        });

        if (!user) {
            // Create new Citizen user
            user = new User({
                name,
                email: normalizedEmail,
                googleId,
                role: 'Citizen',
                phone: `G-${googleId.slice(-8)}` // Placeholder phone for Google users
            });
            await user.save();
        } else if (!user.googleId) {
            // Link Google ID to existing account
            user.googleId = googleId;
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, departmentId: user.departmentId },
            process.env.JWT_SECRET
        );

        res.json({
            token,
            user: { id: user._id, name: user.name, role: user.role, departmentId: user.departmentId }
        });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(500).json({ message: 'Google authentication failed' });
    }
});

module.exports = router;
