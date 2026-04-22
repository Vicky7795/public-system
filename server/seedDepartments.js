require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Department = require('./models/Department');

const strictDepartments = [
    {
        departmentName: 'Electricity',
        description: 'Power supply and street lighting',
        slaHours: 48,
        contactOfficer: 'Nodal Officer'
    },
    {
        departmentName: 'Water',
        description: 'Water supply and pipe leakages',
        slaHours: 48,
        contactOfficer: 'Nodal Officer'
    },
    {
        departmentName: 'PWD',
        description: 'Public Works Department - Roads, bridges, potholes',
        slaHours: 48,
        contactOfficer: 'Nodal Officer'
    },
    {
        departmentName: 'Sanitation',
        description: 'Cleaning and hygiene',
        slaHours: 48,
        contactOfficer: 'Nodal Officer'
    },
    {
        departmentName: 'Drainage',
        description: 'Sewer and blockage issues',
        slaHours: 48,
        contactOfficer: 'Nodal Officer'
    },
    {
        departmentName: 'Garbage',
        description: 'Trash and waste management',
        slaHours: 48,
        contactOfficer: 'Nodal Officer'
    }
];

async function seed() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const deptData of strictDepartments) {
            let dept = await Department.findOne({ departmentName: deptData.departmentName });
            if (!dept) {
                await new Department(deptData).save();
                console.log(`Created new department: ${deptData.departmentName}`);
            } else {
                console.log(`Department already exists: ${deptData.departmentName}`);
            }
        }
        
        console.log('Strict Seeding completed successfully.');
    } catch (err) {
        console.error('Error seeding departments:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
