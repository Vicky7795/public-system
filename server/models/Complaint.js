const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId: { type: String, unique: true, index: true }, // Short 6-char ID e.g. C6CC2F
    title: { type: String, required: true },
    description: { type: String, required: true },
    categoryId: { type: String }, // NEW: ID-based category
    category: { type: String }, // AI predicted or Display category name
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    priority: { type: String }, // Legacy field
    priorityLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    status: { type: String, enum: ['NEW', 'NEEDS_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'OVERDUE', 'ESCALATED'], default: 'NEW' },

    imageData: { type: String },
    // Multilingual AI Fields
    originalText: { type: String }, // Raw description in native language
    translatedText: { type: String }, // English translation
    language: { type: String, default: 'en' }, // Code of selected language (en, hi, ta)
    detectedLanguage: { type: String }, // Language detected by AI
    confidence: { type: Number, min: 0, max: 1 }, // Added for automatic routing threshold
    isMisclassified: { type: Boolean, default: false }, // AI categorization fallback tracking
    requiresTriage: { type: Boolean, default: false }, // Manual review needed if AI confidence low
    
    // Logic Tracking
    aiResultCategory: { type: String }, // Raw category returned by AI
    keywordScore: { type: Number }, // Total score from keyword scanning
    finalDecisionReason: { type: String }, // Explanation: "Strong Keyword Match" or "AI Fallback"
    matchedKeywords: [{ type: String }], // List of words/phrases that triggered routing
    
    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String },
        landmark: { type: String }
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
    reopened: { type: Boolean, default: false },
    hasWarning: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
