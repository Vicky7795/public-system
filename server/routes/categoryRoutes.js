const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

router.get('/', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const categories = await Category.find();
        
        if (categories.length === 0) {
            console.warn('⚠️ No categories found in database. Please run seedCategories.js');
        }

        // Map to return only the name in requested language
        const localized = categories.map(cat => {
            const translation = cat.translations.find(t => t.language === lang) || cat.translations.find(t => t.language === 'en');
            return {
                categoryId: cat.categoryId,
                name: translation ? translation.name : cat.categoryId,
                department: cat.department
            };
        });
        
        res.json(localized);
    } catch (err) {
        console.error('❌ Error fetching categories:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
