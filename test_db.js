const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Connecting to:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected!');
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('Collections:', collections.map(c => c.name));
            process.exit(0);
        } catch (e) {
            console.error('Error listing collections:', e);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
