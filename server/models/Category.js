const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryId: { type: String, required: true, unique: true },
    department: { type: String, required: true }, // e.g., 'electricity', 'water department'
    translations: [{
        language: { type: String, required: true }, // 'en', 'kn', 'hi'
        name: { type: String, required: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
