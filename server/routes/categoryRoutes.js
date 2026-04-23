const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

router.get('/', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const categories = await Category.find();
        
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
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
