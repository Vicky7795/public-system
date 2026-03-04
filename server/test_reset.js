const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testReset() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find a citizen to test with
        const user = await User.findOne({ role: 'Citizen' });
        if (!user) {
            console.log('No citizen user found to test with.');
            return await mongoose.disconnect();
        }

        console.log(`Testing reset for: ${user.email} (Phone: ${user.phone})`);

        const newPass = 'testreset123';

        // Simulate the reset logic
        const targetUser = await User.findOne({ email: user.email, phone: user.phone });
        if (targetUser) {
            targetUser.password = bcrypt.hashSync(newPass, 10);
            await targetUser.save();
            console.log('✅ Password updated in DB successfully.');

            // Verify
            const updatedUser = await User.findOne({ email: user.email });
            const isMatch = bcrypt.compareSync(newPass, updatedUser.password);
            if (isMatch) {
                console.log('✅ Password verification successful.');
            } else {
                console.error('❌ Password verification failed.');
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

testReset();
