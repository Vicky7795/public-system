const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Health Check Endpoint (Version: 1.3.0)
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        version: '1.3.0-universal',
        database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        time: new Date().toISOString()
    });
});

// Manual Bulletproof CORS Middleware 
app.use((req, res, next) => {
    const origin = req.header('Origin');
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: '10mb' }));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ MongoDB connected (Universal)'))
        .catch(err => console.error('❌ MongoDB Error:', err.message));
}

// Routes - Pointing to the 'server' folder
app.use('/api/auth', require('./server/routes/authRoutes'));
app.use('/api/complaints', require('./server/routes/complaintRoutes'));
app.use('/api/departments', require('./server/routes/departmentRoutes'));

app.get('/', (req, res) => {
    res.send('AI Public Grievance API is running (Universal Entry Point - v1.3.0)');
});

// Final Rescue Error Handler
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    res.header('Access-Control-Allow-Origin', req.header('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
