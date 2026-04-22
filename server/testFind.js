require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Department = require('./models/Department');

const findStrictDepartment = async (Department, category) => {
    console.log(`Searching for category: ${category}`);
    let dept = await Department.findOne({ departmentName: new RegExp(`^${category}$`, 'i') });
    console.log(`First find result: ${dept ? dept.departmentName : 'null'}`);
    if (!dept) {
        dept = await Department.findOne({ departmentName: new RegExp(`^Other$`, 'i') });
        console.log(`Fallback find result (Other): ${dept ? dept.departmentName : 'null'}`);
    }
    return dept;
};

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const res = await findStrictDepartment(Department, "Other");
        console.log("Final Output:", res ? res.departmentName : 'NULL!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
