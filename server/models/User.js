const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['Citizen', 'Admin', 'Officer'], default: 'Citizen' },
    // Officer Specific Fields
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    assignedArea: { type: String },
    designation: { type: String, default: 'Officer' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    // Accountability & Performance Metrics
    resolvedCount: { type: Number, default: 0 },
    overdueCount: { type: Number, default: 0 },
    escalatedCount: { type: Number, default: 0 },
    unreadNotifications: { type: Number, default: 0 },
    // Password Reset Fields
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    // OTP Fields
    otp: { type: String },
    otpExpiry: { type: Date },
    otpAttempts: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
