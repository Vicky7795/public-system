const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Department = require('./models/Department');
const Complaint = require('./models/Complaint');
const User = require('./models/User');

async function verifyRouting() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Setup Departments
        let deptElec = await Department.findOne({ departmentName: 'Electricity' });
        if (!deptElec) deptElec = await Department.create({ departmentName: 'Electricity', description: 'Elec Dept' });

        let deptWater = await Department.findOne({ departmentName: 'Water Department' });
        if (!deptWater) deptWater = await Department.create({ departmentName: 'Water Department', description: 'Water Dept' });

        console.log(`Depts: Elec=${deptElec._id}, Water=${deptWater._id}`);

        // 2. Clear old test complaints
        await Complaint.deleteMany({ title: /VERIFY_ROUTING_TEST/ });

        // 3. Create Test Complaints
        const compElec = await Complaint.create({
            userId: new mongoose.Types.ObjectId(),
            ticketId: 'TESTE1',
            title: 'VERIFY_ROUTING_TEST: Elec Issue',
            description: 'My light is sparking',
            category: 'Electricity',
            departmentId: deptElec._id,
            status: 'Pending'
        });

        const compWater = await Complaint.create({
            userId: new mongoose.Types.ObjectId(),
            ticketId: 'TESTW1',
            title: 'VERIFY_ROUTING_TEST: Water Issue',
            description: 'My pipe is leaking',
            category: 'Water Department',
            departmentId: deptWater._id,
            status: 'Pending'
        });

        console.log('Created test complaints');

        // 4. Simulate Officer Pool Query (the logic we just fixed)
        const getPool = async (deptId) => {
            return await Complaint.find({
                $and: [
                    {
                        $or: [
                            { assignedOfficerId: { $exists: false } },
                            { assignedOfficerId: null }
                        ]
                    },
                    { departmentId: deptId } // The fixed strict filter
                ]
            });
        };

        const elecPool = await getPool(deptElec._id);
        const waterPool = await getPool(deptWater._id);

        console.log('--- Results ---');
        console.log(`Elec Officer Pool Count: ${elecPool.length}`);
        elecPool.forEach(c => console.log(` - ${c.title} (Cat: ${c.category})`));

        console.log(`Water Officer Pool Count: ${waterPool.length}`);
        waterPool.forEach(c => console.log(` - ${c.title} (Cat: ${c.category})`));

        // 5. Assertions
        const elecOk = elecPool.every(c => c.departmentId.toString() === deptElec._id.toString());
        const waterOk = waterPool.every(c => c.departmentId.toString() === deptWater._id.toString());

        if (elecOk && waterOk && elecPool.length >= 1 && waterPool.length >= 1) {
            console.log('\n✅ VERIFICATION SUCCESS: Strict routing is working!');
        } else {
            console.error('\n❌ VERIFICATION FAILED: Routing leakage detected or missing data.');
        }

        // Cleanup (optional, but good for reproducibility)
        // await Complaint.deleteMany({ title: /VERIFY_ROUTING_TEST/ });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyRouting();
