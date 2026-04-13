const mongoose = require('mongoose');
const Department = require('./models/Department');
require('dotenv').config();

const departmentsToSeed = [
    { departmentName: "Transport", description: "Handles all transport, traffic, and road accident issues.", slaHours: 48 },
    { departmentName: "Agriculture", description: "Governs farming, crops, irrigation, and subsidies.", slaHours: 72 },
    { departmentName: "Revenue", description: "Handles land categorization, taxation, and incomes.", slaHours: 72 },
    { departmentName: "Social", description: "Handles pensions, disabled rights, and social benefits.", slaHours: 96 },
    { departmentName: "Police", description: "Primary handler for crime, law, order, and theft.", slaHours: 24 },
    { departmentName: "Forest", description: "Handles wildlife, trees, ecological mining disputes.", slaHours: 72 },
    { departmentName: "Water", description: "Resolves water leaks, sewage burst, or supply crises.", slaHours: 24 },
    { departmentName: "Electricity", description: "Resolves power outages, transformers, and billing.", slaHours: 24 },
    { departmentName: "PWD", description: "Public works, bridge infrastructure, and road pavements.", slaHours: 48 },
    { departmentName: "Municipal", description: "Handles sanitation, garbage, waste, and smells.", slaHours: 48 },
    { departmentName: "Health", description: "Management of public health clinics, hygiene issues.", slaHours: 24 },
    { departmentName: "Education", description: "Governs schooling, exam protocols, and scholar grants.", slaHours: 48 }
];

async function seedDepartments() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pgrs_db');
        console.log("Connected to MongoDB for department seeding.");
        
        for (const deptData of departmentsToSeed) {
            await Department.updateOne(
                { departmentName: deptData.departmentName },
                { $set: deptData },
                { upsert: true }
            );
            console.log(`Seeded matching department: "${deptData.departmentName}"`);
        }
        
        console.log("Seeding complete.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seedDepartments();
