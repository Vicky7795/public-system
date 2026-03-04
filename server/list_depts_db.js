const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Department = require('./models/Department');

async function listDepartments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const depts = await Department.find();
        console.log('--- Departments in DB ---');
        depts.forEach(d => console.log(`ID: ${d._id} | Name: ${d.departmentName}`));
        console.log('-------------------------');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listDepartments();
