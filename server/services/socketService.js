let io;

module.exports = {
    init: (server) => {
        io = require('socket.io')(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PATCH", "DELETE", "PUT"]
            }
        });

        io.on('connection', (socket) => {
            console.log(`⚡ New client connected: ${socket.id}`);
            
            socket.on('join_department', (deptId) => {
                socket.join(deptId);
                console.log(`👥 Client ${socket.id} joined room: ${deptId}`);
            });

            socket.on('disconnect', () => {
                console.log('🔥 Client disconnected');
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    },
    emitNewComplaint: (complaint) => {
        if (io) {
            // Format complaint to match the required 'department' string field
            const formattedComplaint = complaint.toObject ? complaint.toObject() : { ...complaint };
            if (complaint.departmentId && complaint.departmentId.departmentName) {
                formattedComplaint.department = complaint.departmentId.departmentName;
            } else {
                formattedComplaint.department = complaint.category;
            }

            // Emit to all admins & officers (matching the requested io.emit behavior)
            io.emit('new_complaint', formattedComplaint);
            
            // Legacy Emit to specific department room (keep for backward compatibility)
            if (complaint.departmentId) {
                const deptId = typeof complaint.departmentId === 'object' ? complaint.departmentId._id : complaint.departmentId;
                io.to(deptId.toString()).emit('new_complaint_pool', formattedComplaint);
            }
        }
    },
    emitStatusUpdate: (complaint) => {
        if (io) {
            io.emit('status_update', complaint);
        }
    }
};
