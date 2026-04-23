require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function reset() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete all complaints
        const Complaint = mongoose.model('Complaint', new mongoose.Schema({}, { strict: false }));
        const result = await Complaint.deleteMany({});
        console.log(`Successfully deleted ${result.deletedCount} complaints.`);

        // Note: We are keeping Departments, Categories, and Users as requested.
        
        console.log('Database reset completed successfully.');
    } catch (err) {
        console.error('Error resetting database:', err);
    } finally {
        await mongoose.disconnect();
    }
}

reset();
