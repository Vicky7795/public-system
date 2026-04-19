const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const automationService = require('./services/automationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Health Check Endpoint (Moved to top for verification)
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        version: '1.2.0-stabilized',
        database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        time: new Date().toISOString()
    });
});

// Manual Bulletproof CORS Middleware 
app.use((req, res, next) => {
    const origin = req.header('Origin');
    // Reflect the requesting origin instead of using boolean true to prevent potential middleware crashes
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Satisfy Google Sign-In COOP requirements - Relaxed for localhost development
    res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
    // Removed strict Embedder Policy to prevent ERR_BLOCKED_BY_RESPONSE

    // Instantly return 200 for OPTIONS (Preflight)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: '10mb' }));

// Database connection with safety check
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in environment variables.');
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ MongoDB connected');
            automationService.init();
        })
        .catch(err => console.error('❌ MongoDB connection error:', err.message));
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));


// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('/*splat', (req, res) => {
        // Exclude /api routes from static serving to let them 404 naturally
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(__dirname, '../client/dist/index.html'));
        }
    });
} else {
    app.get('/', (req, res) => {
        res.send('AI Public Grievance API is running (Version: 1.2.0-stabilized)');
    });
}

// Final Rescue Error Handler
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    const origin = req.header('Origin') || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
