require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./server/models/User');
    const Department = require('./server/models/Department');

    const depts = await Department.find({}).lean();
    console.log('\n=== DEPARTMENT → OFFICER MAPPING ===');
    for (const d of depts) {
        const all = await User.find({ role: 'Officer', departmentId: d._id }).lean();
        const active = await User.find({ role: 'Officer', departmentId: d._id, status: 'Active' }).lean();
        console.log(d.departmentName.padEnd(32), '| All Officers:', all.length, '| Active:', active.length);
    }

    const noStatus = await User.find({ role: 'Officer' }).lean();
    const nullOrMissing = noStatus.filter(o => !o.status);
    console.log('\nOfficers with null/missing status:', nullOrMissing.length);
    nullOrMissing.forEach(o => console.log(' -', o.name, '| status:', o.status));

    const inactive = await User.find({ role: 'Officer', status: 'Inactive' }).lean();
    console.log('Inactive officers:', inactive.length);
    inactive.forEach(o => console.log(' -', o.name));

    process.exit(0);
});
