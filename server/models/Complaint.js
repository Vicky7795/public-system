const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId: { type: String, unique: true, index: true }, // Short 6-char ID e.g. C6CC2F
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String }, // AI predicted category
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    priority: { type: String }, // Legacy field
    priorityLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Reopened'], default: 'Pending' },
    imageData: { type: String },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },
    // Officer Workflow Fields
    assignedOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date },
    resolvedAt: { type: Date },
    slaDeadline: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    notes: [{
        note: String,
        timestamp: { type: Date, default: Date.now }
    }],
    resolutionNote: { type: String },
    proofImage: { type: String },
    // Citizen Interaction
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    reopened: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
