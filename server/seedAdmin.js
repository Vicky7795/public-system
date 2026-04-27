const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

const adminData = {
    name: 'System Administrator',
    email: 'admin@gov.in',
    password: 'Admin@Secure123',
    role: 'Admin',
    phone: '0000000000'
};

async function seedAdmin() {
    try {
        const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
        if (!uri) throw new Error('MONGODB_URI is not defined');

        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const existing = await User.findOne({ email: adminData.email });
        if (existing) {
            console.log('Admin already exists. Updating password...');
            existing.password = bcrypt.hashSync(adminData.password, 10);
            await existing.save();
        } else {
            const admin = new User({
                ...adminData,
                password: bcrypt.hashSync(adminData.password, 10)
            });
            await admin.save();
            console.log('Admin created successfully!');
        }

        console.log('-----------------------------------');
        console.log('Login Details:');
        console.log(`Email: ${adminData.email}`);
        console.log(`Password: ${adminData.password}`);
        console.log('-----------------------------------');

    } catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedAdmin();
