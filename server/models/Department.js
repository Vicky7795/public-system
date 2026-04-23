const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    departmentName: { type: String, required: true, unique: true },
    description: { type: String },
    slaHours: { type: Number, default: 48 },
    contactOfficer: { type: String, default: "Nodal Officer" },
    contactPhone: { type: String },
    contactWhatsApp: { type: String },
}, { timestamps: true });

// Normalize departmentName before saving
departmentSchema.pre('save', async function() {
    if (this.departmentName) {
        this.departmentName = this.departmentName.trim().toLowerCase();
    }
});

module.exports = mongoose.model('Department', departmentSchema);
