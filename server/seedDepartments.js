require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./models/Department');

const STRICT_DEPARTMENTS = [
    { departmentName: 'Electricity', description: 'Power and electrical issues' },
    { departmentName: 'Water', description: 'Water supply and pipe leakages' },
    { departmentName: 'Road', description: 'Potholes and road damages' },
    { departmentName: 'Sanitation', description: 'Cleaning and hygiene' },
    { departmentName: 'Drainage', description: 'Sewer and blockage issues' },
    { departmentName: 'Garbage', description: 'Trash and waste management' },
    { departmentName: 'Other', description: 'Unclassified grievances' }
];

async function seed() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const dep of STRICT_DEPARTMENTS) {
            const exists = await Department.findOne({ departmentName: new RegExp(`^${dep.departmentName}$`, 'i') });
            if (!exists) {
                const newDep = new Department(dep);
                await newDep.save();
                console.log(`Created new department: ${dep.departmentName}`);
            } else {
                console.log(`Department already exists: ${dep.departmentName}`);
            }
        }
        console.log('Seeding completed successfully.');
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
