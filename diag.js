require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Complaint = require('./server/models/Complaint');

    const ids = [
        '69f0740b295748112d5705ed',
        '69efa358729693decae42b5a',
        '69dd100b41891ef700cd8d12',
        '69baa58cbf191d3ef8ca71e6',
        '69e8af41e54e579927e8e98a'
    ];

    for (const id of ids) {
        try {
            const c = await Complaint.findById(id).lean();
            if (!c) {
                console.log(id, '→ NOT FOUND in DB');
            } else {
                console.log(id, '→ status:', c.status, '| category:', c.category);
            }
        } catch(e) {
            console.log(id, '→ ERROR:', e.message);
        }
    }

    // Also show ALL current complaints
    const all = await Complaint.find({}).select('ticketId status category').lean();
    console.log('\n=== ALL COMPLAINTS IN DB ===');
    all.forEach(c => console.log(c.ticketId, '|', c.status, '|', c.category));

    process.exit(0);
});
