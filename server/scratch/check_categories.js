const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config({ path: './server/.env' });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await Category.countDocuments();
        console.log('Category Count:', count);
        if (count > 0) {
            const sample = await Category.find().limit(5);
            console.log('Sample Categories:', JSON.stringify(sample, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
