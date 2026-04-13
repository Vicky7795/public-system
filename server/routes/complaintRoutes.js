const express = require('express');
const router = express.Router();
const axios = require('axios');
const Complaint = require('../models/Complaint');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper to generate Ticket ID
const generateTicketId = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// SLA Mapping
const getSlaDeadline = (priority) => {
    const now = new Date();
    if (priority === 'High') return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    if (priority === 'Medium') return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days (Low)
};

// Public Stats Route (No Auth)
router.get('/public-stats', async (req, res) => {
    try {
        const total = await Complaint.countDocuments();
        const resolved = await Complaint.countDocuments({ status: 'Resolved' });

        // Calculate average response time (from Acceptance to Resolution)
        const resolvedComplaints = await Complaint.find({
            status: 'Resolved',
            acceptedAt: { $exists: true },
            resolvedAt: { $exists: true }
        });

        let avgResponseTime = 24;
        if (resolvedComplaints.length > 0) {
            const totalHours = resolvedComplaints.reduce((acc, curr) => {
                const diff = curr.resolvedAt - curr.acceptedAt;
                return acc + (diff / (1000 * 60 * 60));
            }, 0);
            avgResponseTime = Math.round(totalHours / resolvedComplaints.length) || 24;
        }

        res.json({
            total: total > 1000 ? `${(total / 1000).toFixed(1)}k+` : `${total}`,
            resolved: resolved > 1000 ? `${(resolved / 1000).toFixed(1)}k` : `${resolved}`,
            accuracy: "92%",
            responseTime: `${avgResponseTime}h`
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Middleware to verify JWT
const auth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

// Keyword mapping: category key MUST exactly match department name in DB
const CATEGORY_KEYWORDS = {
    'Transport': ['transport', 'traffic', 'bus', 'auto', 'vehicle', 'road accident', 'license', 'signal', 'crossing', 'parking', 'rickshaw', 'rto'],
    'Agriculture': ['agriculture', 'agri', 'farm', 'crop', 'farmer', 'irrigation', 'pest', 'fertilizer', 'subsidy', 'harvest', 'soil', 'canal', 'livestock', 'farming'],
    'Revenue': ['revenue', 'property tax', 'land record', 'certificate', 'mutation', 'caste', 'ration card', 'income', 'patwari', 'tehsil', 'tax'],
    'Social': ['welfare', 'social', 'pension', 'ration', 'bpl', 'disabled', 'mnrega', 'aadhaar', 'scheme', 'poverty', 'orphan'],
    'Police': ['police', 'crime', 'theft', 'robbery', 'law', 'order', 'fir', 'drug', 'harassment', 'safety', 'fight', 'steal', 'threat', 'cop'],
    'Forest': ['forest', 'tree', 'wildlife', 'poach', 'mining', 'deforest', 'ecology', 'timber', 'nature', 'animal', 'reserve'],
    'Water': ['water', 'leak', 'pipeline', 'tanker', 'sewage', 'pipe', 'tap', 'drain', 'pressure', 'clog', 'burst', 'overflow', 'plumb', 'water supply', 'damaged pipe', 'broken pipe'],
    'Electricity': ['electr', 'power', 'voltage', 'light', 'energy', 'transformer', 'cut', 'bill', 'street light', 'streetlight', 'pole', 'current', 'wire', 'shock', 'short circuit', 'spark', 'bulb', 'lighting', 'electricity', 'fuse', 'meter'],
    'PWD': ['pwd', 'public works', 'road', 'pothole', 'bridge', 'pavement', 'highway', 'asphalt', 'tar', 'concrete', 'infrastructure', 'footpath'],
    'Municipal': ['municipal', 'garbage', 'sanit', 'waste', 'sewer', 'drain', 'clean', 'trash', 'dump', 'smell', 'mosquito', 'litter', 'plastic', 'sanitation'],
    'Health': ['health', 'hospital', 'clinic', 'medical', 'disease', 'dengue', 'vaccine', 'medicine', 'doctor', 'nurse', 'ambulance', 'emergency', 'outbreak'],
    'Education': ['education', 'school', 'teacher', 'student', 'scholarship', 'midday', 'exam', 'bench', 'class', 'college', 'uniform']
};

/**
 * Local keyword-based classifier as a fallback for the AI service.
 * Returns the most likely category based on keyword density.
 */
const classifyTextByKeywords = (text) => {
    let bestCategory = null;
    let maxMatches = 0;
    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0;
        for (const kw of keywords) {
            if (lowerText.includes(kw.toLowerCase())) {
                score++;
            }
        }
        if (score > maxMatches) {
            maxMatches = score;
            bestCategory = category;
        }
    }

    console.log(`[Classification] Keyword fallback chose: ${bestCategory}`);
    return bestCategory;
};

// Smart department lookup: exact match first, then keyword fallback
const findDepartmentForCategory = async (Department, category) => {
    if (!category) {
        console.log(`[Department Discovery] Category is empty. Skipping lookup.`);
        return null;
    }

    console.log(`[Department Discovery] Seeking department for category: "${category}"`);

    // 1. Try exact match (case-insensitive)
    let dept = await Department.findOne({ departmentName: new RegExp(`^${category}$`, 'i') });
    if (dept) {
        console.log(`[Department Discovery] Exact Match found: "${dept.departmentName}"`);
        return dept;
    }

    // 2. Try partial match on department name
    dept = await Department.findOne({ departmentName: new RegExp(category, 'i') });
    if (dept) {
        console.log(`[Department Discovery] Partial Match found: "${dept.departmentName}" for input "${category}"`);
        return dept;
    }

    // 3. Try mapping via CATEGORY_KEYWORDS
    for (const [deptKey, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (category.toLowerCase().includes(deptKey.toLowerCase()) || deptKey.toLowerCase().includes(category.toLowerCase())) {
            dept = await Department.findOne({ departmentName: new RegExp(deptKey, 'i') });
            if (dept) {
                console.log(`[Department Discovery] Mapping Match found: "${dept.departmentName}" via key "${deptKey}"`);
                return dept;
            }
        }
        for (const kw of keywords) {
            if (category.toLowerCase().includes(kw.toLowerCase())) {
                dept = await Department.findOne({ departmentName: new RegExp(deptKey, 'i') });
                if (dept) {
                    console.log(`[Department Discovery] Keyword Mapping Match found: "${dept.departmentName}" via keyword "${kw}"`);
                    return dept;
                }
            }
        }
    }

    console.warn(`[Department Discovery] FAILED to resolve any department for category: "${category}"`);
    return null;
};

// 1. Static GET Routes (Highest Priority)
router.get('/my', auth, async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role === 'Citizen') return res.status(403).json({ message: 'Access denied' });
        const complaints = await Complaint.find().populate('userId', 'name phone').sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/unassigned', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can access the pool' });

        const Department = require('../models/Department');
        const officerDept = await Department.findById(req.user.departmentId);

        if (!officerDept) {
            console.warn(`Officer Pool Fetch: No department found for user ${req.user.id} (deptId: ${req.user.departmentId})`);
            return res.json([]);
        }

        console.log(`Officer Pool Fetch: User=${req.user.email} Dept="${officerDept.departmentName}"`);

        console.log(`Officer Pool Fetch: User=${req.user.email} Dept="${officerDept.departmentName}"`);

        const query = {
            $and: [
                {
                    $or: [
                        { assignedOfficerId: { $exists: false } },
                        { assignedOfficerId: null }
                    ]
                },
                { departmentId: officerDept._id } // Strictly filter by department ID
            ]
        };

        const complaints = await Complaint.find(query).populate('userId', 'name phone').sort({ createdAt: -1 });
        console.log(`Officer Pool Result: Found ${complaints.length} complaints for ${officerDept.departmentName}`);
        res.json(complaints);
    } catch (err) {
        console.error("Pool Fetch Error:", err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/assigned', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can access assigned tasks' });
        const complaints = await Complaint.find({ assignedOfficerId: req.user.id }).populate('userId', 'name phone').sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// (CATEGORY_KEYWORDS and findDepartmentForCategory are defined above the routes)

// 2. Main POST Route (With AI Routing & Optional Auto-Assignment)
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, location, imageData } = req.body;
        console.log("New Grievance Submission Received:", {
            title,
            descriptionLength: description?.length,
            hasLocation: !!location,
            address: location?.address
        });

        // 0. Validate and Process Location payload
        // The frontend now handles geocoding and provides a resolved address.
        if (!location || !location.address) {
            return res.status(400).json({ message: "Valid location address is required." });
        }

        let resolvedLocation = { ...location };
        let category = null;
        let priority = "Medium";
        let departmentId = null;
        let assignedOfficerId = null;

        const combinedInput = `${title} ${description}`;

        // 1. Primary: Local Keyword Classification
        console.log(`[POST /complaints] Running primary Keyword classification...`);
        category = classifyTextByKeywords(combinedInput);

        // 2. Secondary: AI Prediction Fallback
        if (!category) {
            console.log(`[POST /complaints] Keyword classification yielded no match. Triggering AI Fallback...`);
            try {
                const systemPrompt = `Classify the complaint strictly into ONE of the following precise categories: Transport, Agriculture, Revenue, Social, Police, Forest, Water, Electricity, PWD, Municipal, Health, Education.
Ensure you return ONLY one category from this exact list. No exceptions.
Also determine priority: Low, Medium, High, Emergency.
Return ONLY JSON in this format:
{
  "category": "exact category string",
  "priority": "Low | Medium | High | Emergency",
  "confidence": number
}`;

                const aiResponse = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `Complaint: ${combinedInput}` }
                        ],
                        temperature: 0.2,
                        response_format: { type: 'json_object' }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 4000
                    }
                );

                const parsedData = JSON.parse(aiResponse.data.choices[0].message.content);
                category = parsedData.category;
                priority = parsedData.priority || "Medium";
                console.log(`[POST /complaints] OpenAI Prediction Result: category="${category}", priority="${priority}", confidence="${parsedData.confidence}"`);
            } catch (aiErr) {
                console.error("[POST /complaints] AI service fallback error:", aiErr.message);
            }
        } else {
            console.log(`[POST /complaints] Keyword classification assigned category: "${category}"`);
        }

        // 2. Smart Department Resolution
        const Department = require('../models/Department');
        const User = require('../models/User');

        let department = null;
        if (category) {
            department = await findDepartmentForCategory(Department, category);
        }

        if (!department) {
            console.error(`[POST /complaints] Rejecting: Could not route "${category || 'undefined category'}" to a valid department.`);
            return res.status(400).json({ message: "We could not automatically assign your grievance to a valid government department based on the details provided. Please rewrite with more specific details." });
        }
        
        departmentId = department._id;
        console.log(`Department matched: "${department.departmentName}"`);

        // 3. Auto-Assignment (Disabled to prioritize the Intel Pool flow)
        /*
        if (departmentId) {
            const officer = await User.findOne({
                role: 'Officer',
                departmentId: departmentId,
                activeCasesCount: { $lt: 20 } 
            }).sort({ activeCasesCount: 1 });

            if (officer) {
                assignedOfficerId = officer._id;
                await User.findByIdAndUpdate(officer._id, { $inc: { activeCasesCount: 1 } });
            }
        }
        */

        const newComplaint = new Complaint({
            userId: req.user.id,
            ticketId: generateTicketId(),
            title,
            description,
            category,
            departmentId,
            priorityLevel: priority,
            assignedOfficerId,
            location: resolvedLocation,
            imageData: imageData || null,
            status: assignedOfficerId ? 'Assigned' : 'Pending',
            slaDeadline: getSlaDeadline(priority)
        });
        await newComplaint.save();
        console.log(`Grievance Saved: ${newComplaint.ticketId} | Cat: ${category} | Dept: ${department?.departmentName || 'None'} | Officer: ${assignedOfficerId ? 'Assigned' : 'Pool'}`);

        const responseData = newComplaint.toObject();
        if (department) {
            responseData.departmentName = department.departmentName;
        }
        res.json(responseData);
    } catch (err) {
        console.error("Grievance Creation FAILED:", err);
        res.status(500).json({ message: err.message });
    }
});

// 3. Parameterized & Specific Routes
router.get('/track/:ticketId', async (req, res) => {
    try {
        const ticketId = req.params.ticketId.trim().toUpperCase();
        let complaint = await Complaint.findOne({ ticketId }).populate('assignedOfficerId', 'name').select('-imageData');
        if (!complaint && ticketId.length === 24) {
            complaint = await Complaint.findById(ticketId).select('-imageData');
        }
        if (!complaint) return res.status(404).json({ message: 'Ticket not found' });
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id', auth, async (req, res) => {
    try {
        if (req.user.role === 'Citizen') return res.status(403).json({ message: 'Access denied' });
        const { status, officerId } = req.body;
        const updateData = {};
        if (status) updateData.status = status;
        if (officerId) updateData.assignedOfficerId = officerId;
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Officer Flow: Accept Complaint
router.patch('/:id/accept', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can accept tasks' });

        const complaint = await Complaint.findOneAndUpdate(
            {
                _id: req.params.id,
                $or: [
                    { assignedOfficerId: { $exists: false } },
                    { assignedOfficerId: null }
                ]
            },
            { status: 'In Progress', acceptedAt: new Date(), assignedOfficerId: req.user.id },
            { returnDocument: 'after' }
        );

        if (!complaint) return res.status(404).json({ message: 'Complaint not found or already taken' });

        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user.id, { $inc: { activeCasesCount: 1 } });

        res.json(complaint);
    } catch (err) {
        console.error("Manual Accept Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Officer Flow: Claim from Pool + Resolve Directly (one-step resolution)
router.patch('/:id/accept-and-resolve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can resolve tasks' });
        const { resolutionNote, proofImage } = req.body;

        if (!resolutionNote) return res.status(400).json({ message: 'Resolution note is required' });

        // Find the complaint — it should belong to this officer's department
        const Department = require('../models/Department');
        const officerDept = await Department.findById(req.user.departmentId);

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        // Allow if: unassigned (pool), or already assigned to this officer
        const isUnassigned = !complaint.assignedOfficerId;
        const isAssignedToMe = complaint.assignedOfficerId?.toString() === req.user.id;

        if (!isUnassigned && !isAssignedToMe) {
            return res.status(403).json({ message: 'This issue is assigned to another officer' });
        }

        const updated = await Complaint.findByIdAndUpdate(
            req.params.id,
            {
                assignedOfficerId: req.user.id,
                acceptedAt: complaint.acceptedAt || new Date(),
                status: 'Resolved',
                resolvedAt: new Date(),
                resolutionNote,
                proofImage: proofImage || '',
                progress: 100
            },
            { returnDocument: 'after' }
        );

        // Update officer workload
        const User = require('../models/User');
        if (isUnassigned) {
            // Claimed and resolved — no net change needed (claim +1, resolve -1 = 0)
        } else {
            await User.findByIdAndUpdate(req.user.id, { $inc: { activeCasesCount: -1 } });
        }

        console.log(`Direct Resolve: ${updated.ticketId} by ${req.user.id} (${officerDept?.departmentName})`);
        res.json(updated);
    } catch (err) {
        console.error("Direct Resolve Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Officer Flow: Update Progress
router.patch('/:id/progress', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can update progress' });
        const { progress, note } = req.body;
        const update = { progress, status: 'In Progress' }; // Upgrade Assigned → In Progress when officer starts
        if (note) {
            update.$push = { notes: { note, timestamp: new Date() } };
        }
        const complaint = await Complaint.findOneAndUpdate(
            { _id: req.params.id, assignedOfficerId: req.user.id },
            update,
            { returnDocument: 'after' }
        );
        if (!complaint) return res.status(404).json({ message: 'Task not found or not assigned to you' });
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Officer Flow: Resolve
router.patch('/:id/resolve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can resolve tasks' });
        const { resolutionNote, proofImage } = req.body;
        const complaint = await Complaint.findOneAndUpdate(
            { _id: req.params.id, assignedOfficerId: req.user.id },
            {
                status: 'Resolved',
                resolvedAt: new Date(),
                acceptedAt: new Date(), // set if not already set
                resolutionNote,
                proofImage,
                progress: 100
            },
            { returnDocument: 'after' }
        );

        if (!complaint) return res.status(404).json({ message: 'Task not found or not assigned to you' });

        // Decrease officer workload on resolution
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user.id, { $inc: { activeCasesCount: -1 } });
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Citizen Flow: Feedback & Rating
router.patch('/:id/feedback', auth, async (req, res) => {
    try {
        const { rating, feedback } = req.body;

        // Find first to check existence and ownership
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized: You do not own this complaint' });
        }

        complaint.rating = rating;
        complaint.feedback = feedback;
        await complaint.save();

        const updatedComplaint = await Complaint.findById(req.params.id).populate('assignedOfficerId', 'name');
        res.json(updatedComplaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Citizen Flow: Reopen
router.patch('/:id/reopen', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id, status: 'Resolved' },
            { status: 'Reopened', reopened: true, progress: 0 },
            { returnDocument: 'after' }
        );
        if (!complaint) return res.status(400).json({ message: 'Cannot reopen this complaint' });

        // Re-increment officer workload
        if (complaint.assignedOfficerId) {
            const User = require('../models/User');
            await User.findByIdAndUpdate(complaint.assignedOfficerId, { $inc: { activeCasesCount: 1 } });
        }

        const updatedComplaint = await Complaint.findById(complaint._id).populate('assignedOfficerId', 'name');
        res.json(updatedComplaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
