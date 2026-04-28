const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Nodemailer transporter (Gmail SMTP)
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Incoming Registration Request:', req.body);
        const { name, phone, email, password, role, departmentId, assignedArea, designation, status } = req.body;
        const normalizedEmail = email?.toLowerCase().trim();
        if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });

        const normalizedPhone = phone?.toString().trim();
        if (!normalizedPhone) return res.status(400).json({ message: 'Phone number is required' });

        // 1. Check if email exists
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            console.log(`Registration blocked: Email ${normalizedEmail} already taken.`);
            return res.status(400).json({ message: 'User already exists with this email address' });
        }

        // 2. Check if phone exists (to avoid relying solely on catch block for common errors)
        const existingPhone = await User.findOne({ phone: normalizedPhone });
        if (existingPhone) {
            console.log(`Registration blocked: Phone ${normalizedPhone} already taken.`);
            return res.status(400).json({ message: 'User already exists with this phone number' });
        }

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
            userData.designation = designation || 'Officer';
            userData.status = status || 'Active';
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

// Citizen Login
router.post('/citizen/login', async (req, res) => {
    try {
        console.log('[DEBUG] Citizen Login request received:', req.body);
        const { email, password } = req.body;

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        if (user.role !== 'Citizen') {
            return res.status(403).json({ message: 'Access Denied: Please use the Officer portal.' });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role, departmentId: user.departmentId }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user._id, name: user.name, role: user.role, departmentId: user.departmentId } });
    } catch (err) {
        console.error('[CITIZEN LOGIN ERROR]:', err);
        res.status(500).json({ message: err.message });
    }
});

// Officer/Admin Login
router.post('/officer/login', async (req, res) => {
    try {
        console.log('[DEBUG] Officer Login request received:', req.body);
        const { email, password } = req.body;

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail }).populate('departmentId');
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        if (user.role !== 'Officer' && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access Denied: Please use the Citizen portal.' });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const deptId = user.departmentId ? user.departmentId._id : null;
        const deptName = user.departmentId ? user.departmentId.departmentName : null;

        const token = jwt.sign({ id: user._id, role: user.role, departmentId: deptId }, process.env.JWT_SECRET);
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                role: user.role, 
                departmentId: deptId,
                department: deptName 
            } 
        });
    } catch (err) {
        console.error('[OFFICER LOGIN ERROR]:', err);
        res.status(500).json({ message: err.message });
    }

});

// Get all Officers (for Admin Management)
router.get('/officers', async (req, res) => {
    try {
        const officers = await User.find({ role: 'Officer' }, 'name email phone departmentId assignedArea designation status resolvedCount overdueCount escalatedCount')
            .populate('departmentId', 'departmentName');
        res.json(officers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Single Officer
router.get('/officers/:id', async (req, res) => {
    try {
        const officer = await User.findOne({ _id: req.params.id, role: 'Officer' })
            .populate('departmentId', 'departmentName');
        if (!officer) return res.status(404).json({ message: 'Officer not found' });
        res.json(officer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Officer
router.patch('/officers/:id', async (req, res) => {
    try {
        const { name, email, phone, departmentId, assignedArea, designation, status } = req.body;
        const officer = await User.findById(req.params.id);
        if (!officer || officer.role !== 'Officer') return res.status(404).json({ message: 'Officer not found' });

        if (name) officer.name = name;
        if (email) officer.email = email;
        if (phone) officer.phone = phone;
        if (departmentId) officer.departmentId = departmentId;
        if (assignedArea) officer.assignedArea = assignedArea;
        if (designation) officer.designation = designation;
        if (status) officer.status = status;

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

        if (user.role !== 'Citizen') {
            return res.status(403).json({ message: 'Access Denied: Please use the Officer portal.' });
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

const { auth } = require('../middleware/auth');

// Get Notifications
router.get('/notifications', auth, async (req, res) => {
    try {
        const Notification = require('../models/Notification');
        const list = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 }).limit(20);
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark All as Read
router.post('/notifications/read-all', auth, async (req, res) => {
    try {
        const notificationService = require('../services/notificationService');
        await notificationService.markAllRead(req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// Send OTP – Officer / Admin Forgot Password
// ─────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user || !['Officer', 'Admin'].includes(user.role)) {
            return res.status(404).json({ message: 'No Officer or Admin account found with this email.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.otpAttempts = 0;
        await user.save();

        // Send OTP via email if configured
        let emailSent = false;
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = createTransporter();
                await transporter.sendMail({
                    from: `"Duty Desk Entry Portal" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: `Your OTP: ${otp} – Duty Desk Entry Portal`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: #0D47A1; padding: 24px; text-align: center;">
                                <h2 style="color: white; margin: 0;">Duty Desk Entry Portal</h2>
                                <p style="color: #90CAF9; margin: 4px 0 0;">Government of India</p>
                            </div>
                            <div style="padding: 32px; background: #f9fafb; border: 1px solid #e5e7eb;">
                                <h3 style="color: #1e293b;">Password Reset OTP</h3>
                                <p style="color: #475569;">Hello <strong>${user.name}</strong>,</p>
                                <p style="color: #475569;">Your One-Time Password (OTP) for password reset is:</p>
                                <div style="text-align: center; margin: 24px 0;">
                                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #0D47A1; background: #EFF6FF; padding: 16px 24px; border-radius: 8px; border: 2px dashed #93C5FD;">${otp}</span>
                                </div>
                                <p style="color: #94a3b8; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
                            </div>
                        </div>
                    `
                });
                emailSent = true;
            } catch (emailErr) {
                console.error('[OTP EMAIL ERROR]:', emailErr.message);
            }
        }

        res.json({
            message: emailSent ? 'OTP sent to your registered email.' : 'OTP generated.',
            demoOtp: otp  // shown on screen for demo – remove in production
        });

    } catch (err) {
        console.error('[SEND OTP ERROR]:', err);
        res.status(500).json({ message: 'Failed to generate OTP. Please try again.' });
    }
});

// ─────────────────────────────────────────────
// Verify OTP – Officer / Admin
// ─────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !['Officer', 'Admin'].includes(user.role)) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        // Max 3 attempts
        if (user.otpAttempts >= 3) {
            user.otp = undefined; user.otpExpiry = undefined; user.otpAttempts = 0;
            await user.save();
            return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });
        }

        // Check expiry
        if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Check match
        if (user.otp !== otp.toString().trim()) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();
            const remaining = 3 - user.otpAttempts;
            return res.status(400).json({ message: `Incorrect OTP. ${remaining} attempt(s) remaining.` });
        }

        // OTP valid — issue a short-lived reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otp = undefined; user.otpExpiry = undefined; user.otpAttempts = 0;
        await user.save();

        res.json({ message: 'OTP verified successfully.', resetToken });

    } catch (err) {
        console.error('[VERIFY OTP ERROR]:', err);
        res.status(500).json({ message: 'Verification failed. Please try again.' });
    }
});

// ─────────────────────────────────────────────
// Forgot Password – Officer / Admin
// ─────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Security: always respond success to not reveal if email exists
        if (!user || !['Officer', 'Admin'].includes(user.role)) {
            return res.json({ message: 'If this email is registered, a reset link has been sent.' });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        user.resetToken = token;
        user.resetTokenExpiry = expiry;
        await user.save();

        // Build reset URL
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/officer/reset-password?token=${token}`;

        // Send email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = createTransporter();
            await transporter.sendMail({
                from: `"Duty Desk Entry Portal" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Password Reset Request – Duty Desk Entry Portal',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #0D47A1; padding: 24px; text-align: center;">
                            <h2 style="color: white; margin: 0;">Duty Desk Entry Portal</h2>
                            <p style="color: #90CAF9; margin: 4px 0 0;">Government of India</p>
                        </div>
                        <div style="padding: 32px; background: #f9fafb; border: 1px solid #e5e7eb;">
                            <h3 style="color: #1e293b;">Password Reset Request</h3>
                            <p style="color: #475569;">Hello <strong>${user.name}</strong>,</p>
                            <p style="color: #475569;">You requested a password reset for your ${user.role} account. Click the button below to reset your password. This link is valid for <strong>30 minutes</strong>.</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${resetUrl}" style="background: #0D47A1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Reset Password</a>
                            </div>
                            <p style="color: #94a3b8; font-size: 13px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
                            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">This is an automated message. Do not reply to this email.</p>
                        </div>
                    </div>
                `
            });
        } else {
            // Dev fallback: log the token to server console
            console.log(`\n[DEV PASSWORD RESET]\nUser: ${user.email}\nReset URL: ${resetUrl}\n`);
        }

        res.json({ message: 'If this email is registered, a reset link has been sent.' });
    } catch (err) {
        console.error('[FORGOT PASSWORD ERROR]:', err);
        res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }
});

// ─────────────────────────────────────────────
// Reset Password – Officer / Admin
// ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
        if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() } // not expired
        });

        if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' });

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (err) {
        console.error('[RESET PASSWORD ERROR]:', err);
        res.status(500).json({ message: 'Failed to reset password. Please try again.' });
    }
});

module.exports = router;
