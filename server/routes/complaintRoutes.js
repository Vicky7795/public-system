const express = require('express');
const router = express.Router();
const axios = require('axios');
const Complaint = require('../models/Complaint');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const assignmentService = require('../services/assignmentService');
const notificationService = require('../services/notificationService');
const User = require('../models/User');
const Department = require('../models/Department');
const { auth, adminAuth } = require('../middleware/auth');

// Helper to generate Ticket ID
const generateTicketId = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// SLA Mapping
const getSlaDeadline = (priority) => {
    const now = new Date();
    const p = (priority || 'Medium').toLowerCase();
    
    if (p === 'emergency') return new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
    if (p === 'high') return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    if (p === 'medium') return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
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

/**
 * @route   GET /api/complaints/reverse-geocode
 * @desc    Highly accurate backend proxy for Geocoding (Free OpenStreetMap/Nominatim)
 */
router.get('/reverse-geocode', async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and Longitude are required." });
    }

    try {
        console.log(`[Geocode Proxy] Resolving address via Nominatim for (${lat}, ${lng})`);
        
        // Nominatim (OpenStreetMap) - Completely Free
        const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`,
            { 
                headers: { 
                    'Accept-Language': 'en', 
                    'User-Agent': 'CitizenGrievancePortal/1.0 (Government-System)' 
                } 
            }
        );

        if (!geoRes.data || !geoRes.data.address) {
            throw new Error("No address found for these coordinates.");
        }

        const a = geoRes.data.address || {};
        const parts = [
            a.road || a.pedestrian || a.footway,
            a.suburb || a.neighbourhood || a.quarter || a.locality,
            a.city || a.town || a.village || a.county,
            a.state,
            a.postcode,
            a.country
        ].filter(Boolean);

        const address = parts.length > 0 ? parts.join(', ') : geoRes.data.display_name;
        
        res.json({ 
            address, 
            display_name: geoRes.data.display_name, 
            raw: geoRes.data, 
            provider: 'nominatim',
            structured: {
                street: a.road || a.pedestrian || '',
                area: a.suburb || a.neighbourhood || '',
                city: a.city || a.town || a.village || '',
                state: a.state || '',
                pincode: a.postcode || ''
            }
        });

    } catch (err) {
        console.error("[Backend Geocode Proxy] Error:", err.message);
        res.status(502).json({ message: "Failed to resolve address from coordinate provider." });
    }
});

/**
 * @route   GET /api/complaints/geocode-search
 * @desc    Backend proxy for Nominatim location search (avoids browser CORS block)
 * @query   q - search string
 */
router.get('/geocode-search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        return res.status(400).json({ message: 'Search query too short.' });
    }

    // Validate pincode: must be a valid Indian 6-digit pincode
    const isPincode = /^\d+$/.test(q.trim());
    if (isPincode) {
        const indianPincodeRegex = /^[1-9][0-9]{5}$/;
        if (!indianPincodeRegex.test(q.trim())) {
            return res.status(400).json({ message: 'Please enter a valid 6-digit Indian pincode.' });
        }
    }

    try {
        // Always append India to the query and restrict countrycodes to India
        const searchQuery = q.trim().toLowerCase().includes('india') ? q.trim() : `${q.trim()}, India`;

        const searchRes = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&countrycodes=in&format=json&limit=8&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'CitizenGrievancePortal/2.0 (Government-System)'
                }
            }
        );

        // Server-side safety filter: only return results tagged as India
        const indiaOnly = (searchRes.data || []).filter(r => {
            const country = r.address?.country_code || '';
            return country.toLowerCase() === 'in';
        });

        res.json(indiaOnly);
    } catch (err) {
        console.error('[Geocode Search Proxy] Error:', err.message);
        res.status(502).json({ message: 'Failed to search location.' });
    }
});

/**
 * @route   GET /api/complaints/ip-location
 * @desc    Fallback to IP-based location if GPS is unavailable
 */
router.get('/ip-location', async (req, res) => {
    try {
        console.log('[Geocode Proxy] Fetching IP-based location fallback...');
        const geoRes = await axios.get('https://ipapi.co/json/', {
            headers: { 'User-Agent': 'CitizenGrievancePortal/1.0' },
            timeout: 3000
        });

        if (!geoRes.data || geoRes.data.error) {
            throw new Error(geoRes.data?.reason || "IP Geolocation failed");
        }

        res.json({
            lat: geoRes.data.latitude,
            lng: geoRes.data.longitude,
            city: geoRes.data.city,
            state: geoRes.data.region,
            country: geoRes.data.country_name,
            pincode: geoRes.data.postal,
            accuracy: 1000,
            isIP: true
        });
    } catch (err) {
        console.error("[Backend IP-Location Error]:", err.message);
        res.status(502).json({ message: "Could not determine IP location." });
    }
});




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
        const complaints = await Complaint.find()
            .populate('userId', 'name phone')
            .populate('assignedOfficerId', 'name')
            .populate('departmentId', 'departmentName')
            .sort({ createdAt: -1 });
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

// 2. Main POST Route (With AI Routing & Automated Assignment)
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, location, imageData, language = 'en' } = req.body;
        console.log("New Grievance Submission Received:", {
            title,
            language,
            descriptionLength: description?.length,
            hasLocation: !!location,
            address: location?.address
        });

        // 0. Base Input Validation
        if (!title || typeof title !== 'string' || title.trim().length < 5) {
            return res.status(400).json({ message: "A descriptive title (min 5 chars) is required." });
        }
        if (!description || typeof description !== 'string' || description.trim().length < 10) {
            return res.status(400).json({ message: "A detailed description (min 10 chars) is required." });
        }
        if (!location || !location.address) {
            return res.status(400).json({ message: "Valid location address is required." });
        }

        let resolvedLocation = { ...location };
        let category = null;
        let priority = "Medium";
        let departmentId = null;
        
        let translatedTitle = title;
        let translatedDescription = description;

        const combinedInput = `${title} ${description}`;
        const hasAI = !!process.env.OPENAI_API_KEY;

        // 1. Classification & Translation
        // If English, try local keyword matching first to save API calls
        if (language === 'en') {
            category = classifyTextByKeywords(combinedInput);
        }

        // If not English, or if English keyword matching failed, try AI (ONLY IF KEY EXISTS)
        if ((!category || language !== 'en') && hasAI) {
            try {
                const systemPrompt = `You are an expert civic grievance analyzer and translator.
1. Strictly classify the complaint into ONE of these precise categories: Transport, Agriculture, Revenue, Social, Police, Forest, Water, Electricity, PWD, Municipal, Health, Education.
2. Determine Priority: Low, Medium, High, Emergency.
3. Translate the title and description into clear, professional English. If it is already in English, return it identically.
Return ONLY JSON: { "category": "category string", "priority": "priority string", "translatedTitle": "string", "translatedDescription": "string" }`;

                const aiResponse = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `Title: ${title}\nDescription: ${description}` }
                        ],
                        temperature: 0.2,
                        response_format: { type: 'json_object' }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 8000
                    }
                );

                const parsedData = JSON.parse(aiResponse.data.choices[0].message.content);
                category = parsedData.category;
                priority = parsedData.priority || "Medium";
                translatedTitle = parsedData.translatedTitle || title;
                translatedDescription = parsedData.translatedDescription || description;
            } catch (aiErr) {
                console.error("[POST /complaints] AI failure during active mode:", aiErr.message);
                // Fallback to local keywords since AI call failed
                category = category || classifyTextByKeywords(combinedInput);
            }
        } else if (!hasAI) {
            // FORCE FREE MODE
            console.log("[MODE] Grievance processed in FREE MODE (Key missing)");
            category = category || classifyTextByKeywords(combinedInput);
        }

        // 2. Department Resolution
        const department = await findDepartmentForCategory(Department, category);
        if (!department) {
            return res.status(400).json({ message: "We could not automatically assign your grievance. Please provide more specific details." });
        }
        
        departmentId = department._id;

        // 3. Create Complaint (Save First)
        const newComplaint = new Complaint({
            userId: req.user.id,
            ticketId: generateTicketId(),
            title: translatedTitle, // Default to english for primary UI
            description: translatedDescription, 
            originalText: combinedInput,
            translatedText: `${translatedTitle} - ${translatedDescription}`,
            language: language,
            category,
            departmentId,
            priorityLevel: priority,
            location: {
                ...resolvedLocation,
                landmark: req.body.location?.landmark || null
            },
            imageData: imageData || null,
            status: 'Pending',
            slaDeadline: getSlaDeadline(priority)
        });
        await newComplaint.save();

        // 4. Trigger Auto-Assignment Service
        await assignmentService.assignToOfficer(newComplaint, departmentId);

        // 5. Final Fetch for Response
        const populated = await Complaint.findById(newComplaint._id)
            .populate('assignedOfficerId', 'name')
            .populate('departmentId');

        res.json(populated);
    } catch (err) {
        console.error("Grievance Creation FAILED:", err);
        res.status(500).json({ message: err.message });
    }
});

// 3. Parameterized & Specific Routes
router.get('/track/:ticketId', async (req, res) => {
    try {
        const ticketId = req.params.ticketId.trim().toUpperCase();
        let complaint = await Complaint.findOne({ ticketId })
            .populate('assignedOfficerId', 'name')
            .populate('departmentId')
            .select('-imageData');
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
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('assignedOfficerId', 'name');
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

        // Update officer workload and performance
        const User = require('../models/User');
        const updateQuery = { $inc: { resolvedCount: 1 } };
        if (!isUnassigned) updateQuery.$inc.activeCasesCount = -1;
        await User.findByIdAndUpdate(req.user.id, updateQuery);

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

        // Decrease officer workload and increase performance on resolution
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user.id, { $inc: { activeCasesCount: -1, resolvedCount: 1 } });
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

// ==========================================
// ADMIN CONTROL ENDPOINTS (RESTRICTED)
// ==========================================



// Admin: Reassign Complaint
router.patch('/:id/reassign', auth, adminAuth, async (req, res) => {
    try {
        const { officerId } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        // Handle Unassignment (Unstacking the officer and moving back to Pool)
        if (!officerId || officerId === '' || officerId === 'null') {
            const oldOfficerId = complaint.assignedOfficerId;
            if (oldOfficerId) {
                await User.findByIdAndUpdate(oldOfficerId, { $inc: { activeCasesCount: -1 } });
            }
            complaint.assignedOfficerId = null;
            complaint.status = 'Pending';
            if (!complaint.notes) complaint.notes = [];
            complaint.notes.push({ note: `ADMIN ACTION: Unassigned from previous officer. Returned to Department Pool.` });
            await complaint.save();
            
            const updated = await Complaint.findById(complaint._id).populate('assignedOfficerId', 'name email phone');
            return res.json({ success: true, complaint: updated });
        }

        // Validate New Officer
        const oldOfficerId = complaint.assignedOfficerId;
        const newOfficer = await User.findById(officerId);
        if (!newOfficer || newOfficer.role !== 'Officer') {
            return res.status(400).json({ message: 'Invalid officer selected for assignment.' });
        }

        // Prevent redundant reassignment to same officer
        if (oldOfficerId && oldOfficerId.toString() === officerId) {
            return res.json({ success: true, complaint });
        }

        // Rebalance workloads
        if (oldOfficerId) {
            await User.findByIdAndUpdate(oldOfficerId, { $inc: { activeCasesCount: -1 } });
        }
        await User.findByIdAndUpdate(officerId, { $inc: { activeCasesCount: 1 } });

        complaint.assignedOfficerId = officerId;
        complaint.status = 'Assigned';
        if (!complaint.notes) complaint.notes = [];
        complaint.notes.push({ note: `ADMIN REASSIGNMENT: Moved to ${newOfficer.name}` });
        await complaint.save();

        // Notify New Officer
        await notificationService.send({
            recipientId: officerId,
            type: 'NEW_ASSIGNMENT',
            message: `ADMIN ACTION: Case #${complaint.ticketId} has been reassigned to you.`,
            complaintId: complaint._id,
            priority: 'HIGH'
        });

        const updated = await Complaint.findById(complaint._id).populate('assignedOfficerId', 'name email phone');
        res.json({ success: true, complaint: updated });
    } catch (err) {
        console.error(`[Admin Reassign Error] Complaint ID: ${req.params.id}, Error:`, err);
        res.status(500).json({ message: "Failed to process reassignment. Check if the officer ID is valid." });
    }
});

// Admin: Send Warning
router.post('/:id/warn', auth, adminAuth, async (req, res) => {
    try {
        const { message } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint || !complaint.assignedOfficerId) {
            return res.status(400).json({ message: 'Cannot warn: No officer assigned' });
        }

        const warningMsg = message || `URGENT COMMAND WARNING: Stagnant progress on #${complaint.ticketId}. Resolve immediately.`;

        await notificationService.send({
            recipientId: complaint.assignedOfficerId,
            type: 'ADMIN_WARNING',
            message: warningMsg,
            complaintId: complaint._id,
            priority: 'HIGH'
        });

        complaint.hasWarning = true;
        complaint.notes.push({ note: `SYSTEM ALERT: Command Warning issued to officer. Reason: ${warningMsg}` });
        await complaint.save();

        const updated = await Complaint.findById(req.params.id).populate('assignedOfficerId', 'name email phone');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Set Priority
router.patch('/:id/priority', auth, adminAuth, async (req, res) => {
    try {
        const { priorityLevel } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id, 
            { priorityLevel }, 
            { new: true }
        ).populate('assignedOfficerId', 'name email phone');
        
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Add Remark
router.post('/:id/remark', auth, adminAuth, async (req, res) => {
    try {
        const { remark } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        complaint.notes.push({ note: `ADMIN REMARK: ${remark}` });
        await complaint.save();

        const updated = await Complaint.findById(req.params.id).populate('assignedOfficerId', 'name email phone');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
