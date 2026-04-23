require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Department = require('../models/Department');

async function list() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const deps = await Department.find();
        console.log(JSON.stringify(deps, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

list();
