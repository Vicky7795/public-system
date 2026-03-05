const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/departments', departmentRoutes);

function print(path, layer) {
    if (layer.route) {
        layer.route.stack.forEach(print.bind(null, path + layer.route.path));
    } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(print.bind(null, path + (layer.regexp.source.replace('\\/?', '').replace('(?=\\/|$)', '').replace('^\\/', '/').replace('\\/', '/'))));
    } else if (layer.method) {
        console.log('%s /api%s', layer.method.toUpperCase(), path);
    }
}

console.log('Registered Routes:');
app._router.stack.forEach(print.bind(null, ''));
process.exit(0);
