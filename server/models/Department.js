const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    departmentName: { type: String, required: true, unique: true },
    description: { type: String },
    slaHours: { type: Number, default: 48 },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
