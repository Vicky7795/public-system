const mongoose = require('mongoose');
const Department = require('../models/Department');
require('dotenv').config({ path: './server/.env' });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const deps = await Department.find();
        console.log('Departments in DB:', deps.map(d => d.departmentName));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
