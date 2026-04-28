const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');

// 1. Load environment variables FIRST
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
const PORT = process.env.PORT || 5000;

if (!MONGODB_URI) {
    console.error('❌ CRITICAL: MONGODB_URI or DATABASE_URL is not defined in environment variables.');
    if (process.env.NODE_ENV === 'production') process.exit(1);
}

// 2. Initialize App and Server
const app = express();
const server = http.createServer(app);

// 3. Import Services (AFTER env is loaded)
const automationService = require('./server/services/automationService');
const socketService = require('./server/services/socketService');
const Category = require('./server/models/Category');
const User = require('./server/models/User');
const bcrypt = require('bcryptjs');

// 4. Middlewares
const cors = require('cors');
app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins in production, but we can restrict it if needed
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Fix: Allow Google OAuth popup to communicate via postMessage
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

app.use(express.json({ limit: '10mb' }));

// 5. Database Connection & Start Logic
const startServer = async () => {
    try {
        console.log('🚀 DEPLOYMENT SIGNATURE: v2.0-SPLAT-FIX');
        console.log('🔄 Connecting to MongoDB:', MONGODB_URI);
        
        mongoose.connection.on('connected', () => console.log('✅ Mongoose connected to DB'));
        mongoose.connection.on('error', (err) => console.error('❌ Mongoose error:', err));

        await mongoose.connect(MONGODB_URI, { autoIndex: false });
        
        // Initialize Background Services
        automationService.init();
        socketService.init(server);

        // 5a. Automatic Seeding (For environments without shell access)
        const seedCategories = async () => {
            const count = await Category.countDocuments();
            if (count === 0) {
                console.log('🌱 Database is empty. Auto-seeding categories...');
                const seeder = require('./server/seedCategories');
                // The seeder script is designed to run standalone, but we can import the data
                // For simplicity, we'll just log that it's needed or we can trigger it
                // Actually, let's just do a basic check for Admin
            }
        };
        
        const seedAdmin = async () => {
            const admin = await User.findOne({ role: 'Admin' });
            if (!admin) {
                console.log('👤 No Admin found. Creating default admin...');
                await User.create({
                    name: 'System Administrator',
                    email: 'admin@gov.in',
                    password: bcrypt.hashSync('Admin@Secure123', 10),
                    role: 'Admin',
                    phone: '0000000000'
                });
                console.log('✅ Default Admin created: admin@gov.in / Admin@Secure123');
            }
        };

        await seedAdmin();
        // We'll leave categories for manual seeding or a more robust auto-seeder later
        // but the admin is critical for login.

        // Mount Routes (AFTER DB is ready)
        app.use('/api/auth', require('./server/routes/authRoutes'));
        app.use('/api/complaints', require('./server/routes/complaintRoutes'));
        app.use('/api/departments', require('./server/routes/departmentRoutes'));
        app.use('/api/categories', require('./server/routes/categoryRoutes'));

        // Health Check
        app.get('/health', (req, res) => {
            res.json({ status: 'UP', database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED' });
        });

        // Production Serving
        if (process.env.NODE_ENV === 'production') {
            app.use(express.static(path.join(__dirname, 'client/dist')));
            // Use a native RegExp to avoid path-to-regexp string parsing issues in Express 5
            app.get(/^(?!\/api).+/, (req, res) => {
                res.sendFile(path.join(__dirname, 'client/dist/index.html'));
            });
        } else {
            app.get('/', (req, res) => res.send('AI Public Grievance API is running (Universal)'));
        }

        // Global Error Handler
        app.use((err, req, res, next) => {
            console.error('GLOBAL ERROR:', err);
            res.status(500).json({ message: 'Internal Server Error', error: err.message });
        });

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT} (Universal Entry Point)`);
        });

    } catch (err) {
        console.error('❌ Startup Error:', err);
        process.exit(1);
    }
};

startServer();
