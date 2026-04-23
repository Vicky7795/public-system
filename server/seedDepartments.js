require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Department = require('./models/Department');

const strictDepartments = [
    { departmentName: 'Water Department', description: 'Supply, leakages, and connections', slaHours: 48 },
    { departmentName: 'Electricity Department', description: 'Power supply, billing, and outages', slaHours: 48 },
    { departmentName: 'PWD', description: 'Public Works Department - Roads and infrastructure', slaHours: 72 },
    { departmentName: 'Municipal Department', description: 'Garbage, sanitation, and street maintenance', slaHours: 48 },
    { departmentName: 'Health Department', description: 'Hospitals, clinics, and public health', slaHours: 48 },
    { departmentName: 'Education Department', description: 'Schools, colleges, and scholarships', slaHours: 72 },
    { departmentName: 'Transport Department', description: 'Buses, traffic, and licensing', slaHours: 48 },
    { departmentName: 'Agriculture Department', description: 'Farming, seeds, and irrigation', slaHours: 72 },
    { departmentName: 'Revenue Department', description: 'Land records, taxes, and surveys', slaHours: 72 },
    { departmentName: 'Social Welfare Department', description: 'Pensions, disabled care, and schemes', slaHours: 72 },
    { departmentName: 'Police Department', description: 'Public safety, crime, and security', slaHours: 24 },
    { departmentName: 'Forest Department', description: 'Wildlife, trees, and environmental issues', slaHours: 72 },
    { departmentName: 'General Department', description: 'Any uncategorized or miscellaneous complaints', slaHours: 72 }
];

async function seed() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // We will keep existing departments to avoid broken references, 
        // but ensure these exact 12 exist for our routing logic.
        for (const deptData of strictDepartments) {
            let dept = await Department.findOne({ departmentName: new RegExp(`^${deptData.departmentName}$`, 'i') });
            if (!dept) {
                await new Department({ ...deptData, contactOfficer: 'Nodal Officer' }).save();
                console.log(`Created: ${deptData.departmentName}`);
            } else {
                console.log(`Exists: ${deptData.departmentName}`);
            }
        }
        
        console.log('Strict 12-Dept Seeding completed.');
    } catch (err) {
        console.error('Error seeding departments:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
