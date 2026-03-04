const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully to:', process.env.MONGODB_URI))
    .catch(err => {
        console.error('❌ MongoDB connection error!');
        console.error('   Make sure MongoDB is running on:', process.env.MONGODB_URI);
        console.error('   Error details:', err.message);
    });

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));

app.get('/', (req, res) => {
    res.send('AI Public Grievance API is running');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
