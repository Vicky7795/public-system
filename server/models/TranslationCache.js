const mongoose = require('mongoose');

const translationCacheSchema = new mongoose.Schema({
    textHash: { type: String, required: true, unique: true, index: true },
    originalText: { type: String, required: true },
    translatedText: { type: String, required: true },
    language: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('TranslationCache', translationCacheSchema);
