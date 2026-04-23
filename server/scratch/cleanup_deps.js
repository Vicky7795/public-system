require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

const STRICT_LIST = [
    'Water Department',
    'Electricity Department',
    'PWD',
    'Municipal Department',
    'Health Department',
    'Education Department',
    'Transport Department',
    'Agriculture Department',
    'Revenue Department',
    'Social Welfare Department',
    'Police Department',
    'Forest Department',
    'General Department'
];

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find or create General Department for fallback
        let generalDept = await Department.findOne({ departmentName: /General Department/i });
        if (!generalDept) {
            generalDept = await new Department({ 
                departmentName: 'General Department', 
                description: 'Fallback department', 
                slaHours: 72 
            }).save();
        }

        const allDeps = await Department.find();
        
        for (const dept of allDeps) {
            const isStrict = STRICT_LIST.some(name => name.toLowerCase() === dept.departmentName.toLowerCase());
            
            if (!isStrict) {
                console.log(`Cleaning up: ${dept.departmentName} (${dept._id})`);
                
                // Reassign complaints
                const cResult = await Complaint.updateMany(
                    { departmentId: dept._id },
                    { $set: { departmentId: generalDept._id } }
                );
                console.log(`  - Reassigned ${cResult.modifiedCount} complaints to General Department`);

                // Reassign officers
                const oResult = await User.updateMany(
                    { departmentId: dept._id },
                    { $set: { departmentId: generalDept._id } }
                );
                console.log(`  - Reassigned ${oResult.modifiedCount} officers to General Department`);

                // Delete department
                await Department.findByIdAndDelete(dept._id);
                console.log(`  - Deleted ${dept.departmentName}`);
            } else {
                // Ensure name is exactly as in STRICT_LIST
                const correctName = STRICT_LIST.find(name => name.toLowerCase() === dept.departmentName.toLowerCase());
                if (dept.departmentName !== correctName) {
                    dept.departmentName = correctName;
                    await dept.save();
                    console.log(`  - Renamed ${dept.departmentName} to ${correctName}`);
                }
            }
        }

        console.log('Cleanup completed. Only strict departments remain.');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();
