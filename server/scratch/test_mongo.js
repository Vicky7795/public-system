const mongoose = require('mongoose');

const uri = "mongodb+srv://nagarevivek206_db_user:nagarevivek206_db_user@cluster0.sqyv5qq.mongodb.net/?retryWrites=true&w=majority";

console.log('Attempting to connect to MongoDB...');
mongoose.connect(uri)
    .then(() => {
        console.log('✅ Connection SUCCESSFUL!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection FAILED!');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        process.exit(1);
    });
