require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Department = require('./models/Department');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const deps = await Department.find();
        console.log(deps);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
