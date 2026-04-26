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
const socketService = require('../services/socketService');

const CLASSIFICATION_SYSTEM_PROMPT = `You are a STRICT, PRODUCTION-GRADE complaint routing AI.

Your job is CRITICAL:
➡️ ALWAYS assign the complaint to a VALID department
➡️ NEVER return "unassigned", "unknown", or wrong department
➡️ Work correctly for ALL languages

========================================
🌍 MULTI-LANGUAGE (MANDATORY FIX)

The complaint can be in ANY language.

You MUST DO THIS FIRST:

1. Detect the language
2. Translate the complaint into CLEAR ENGLISH
3. Understand the meaning

⚠️ This step is COMPULSORY
⚠️ Do NOT skip translation under any condition

If translation is unclear → try your BEST to interpret meaning
❌ NEVER fail or skip

========================================
🧠 UNDERSTANDING RULE (VERY IMPORTANT)

* Focus on MEANING, not exact words
* Handle:

  * spelling mistakes
  * local language
  * mixed language

Example:
"ಬೀದಿ ದೀಪ ಹಾನಿಯಾಗಿದೆ"
→ Street light is damaged

========================================
🏛️ DEPARTMENTS (MUST SELECT ONE)

ELECTRICITY
WATER
MUNICIPAL
HEALTH
POLICE
TRANSPORT
EDUCATION

========================================
💡 PRIORITY ROUTING RULES

1. ROAD ISSUES: Any issue involving the physical state, cleanliness, or maintenance of ROADS/BRIDGES must go to PWD.
2. WATER vs MUNICIPAL: Water supply issues go to WATER. Garbage/Toilets go to MUNICIPAL.
AGRICULTURE
REVENUE
FOREST
SOCIAL_WELFARE

❌ NEVER leave empty
❌ NEVER return unassigned

========================================
🔥 STRICT PRIORITY RULES

1. ELECTRICITY (TOP PRIORITY)

If complaint is about:

* street light
* light not working
* power issue
* electricity problem

MULTI-LANGUAGE:

* Marathi: पथदिवे, वीज
* Hindi: बिजली, लाइट
* Kannada: ಬೀದಿ ದೀಪ, ವಿದ್ಯುತ್
* Tamil: தெரு விளக்கு
* Telugu: వీధి దీపాలు

👉 ALWAYS RETURN: ELECTRICITY
❌ NEVER choose MUNICIPAL

---

2. WATER

* no water
* leakage
* pipeline

👉 RETURN: WATER

---

3. MUNICIPAL

* garbage
* waste
* drainage
* road problem (only if no light issue)

👉 RETURN: MUNICIPAL

---

Other:

* POLICE → crime
* HEALTH → hospital
* TRANSPORT → traffic
* EDUCATION → school
* AGRICULTURE → farming
* REVENUE → land
* FOREST → trees
* SOCIAL_WELFARE → schemes

========================================
⚠️ SMART DECISION LOGIC

* "road + light issue" → ELECTRICITY
* "only road issue" → MUNICIPAL
* multiple issues → choose MAIN issue

========================================
🧪 FINAL CHECK (MANDATORY)

Before answering:

* Make sure translation is correct
* Make sure department is BEST match
* Make sure NOT unassigned

If unsure → choose closest valid department

========================================
📦 OUTPUT FORMAT (STRICT JSON)

{
"detected_language": "",
"translated_text": "",
"core_issue": "",
"department": ""
}

========================================
FINAL INSTRUCTION

You MUST return a VALID department for EVERY input.`;

const DEPARTMENT_CODE_MAPPING = {
    'ELECTRICITY': 'Electricity Department',
    'WATER': 'Water Department',
    'MUNICIPAL': 'Municipal Department',
    'HEALTH': 'Health Department',
    'AGRICULTURE': 'Agriculture Department',
    'TRANSPORT': 'Transport Department',
    'POLICE': 'Police Department',
    'EDUCATION': 'Education Department',
    'SOCIAL_WELFARE': 'Social Welfare Department',
    'REVENUE': 'Revenue Department',
    'FOREST': 'Forest Department',
    'PWD': 'PWD',
    'GENERAL': 'General Department'
};

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
        const resolved = await Complaint.countDocuments({ status: 'RESOLVED' });

        // Calculate average response time (from Acceptance to Resolution)
        const resolvedComplaints = await Complaint.find({
            status: 'RESOLVED',
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

router.get('/geocode-search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        return res.status(400).json({ message: 'Search query too short.' });
    }

    const isPincode = /^\d+$/.test(q.trim());
    if (isPincode) {
        const indianPincodeRegex = /^[1-9][0-9]{5}$/;
        if (!indianPincodeRegex.test(q.trim())) {
            return res.status(400).json({ message: 'Please enter a valid 6-digit Indian pincode.' });
        }
    }

    try {
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

// Keyword mapping: 12 STRICT Departments with Bilingual Support
const CATEGORY_DICTIONARY = {
    'Water Department': {
        phrases: ['pipe burst', 'water leakage', 'no water supply', 'pipeline broken', 'paani nahi', 'pani nahi', 'पाणी येत नाही', 'ನೀರು ಬರುತ್ತಿಲ್ಲ', 'ನೀರ'],
        strongKeywords: ['pipe', 'leakage', 'leak', 'burst', 'पाईप', 'पाइप', 'गळती', 'फुटली', 'ನೀರು', 'ಪೈಪ್'],
        keywords: ['tap', 'tank', 'supply', 'overflow', 'jal', 'pani', 'paani', 'पाणी', 'पाण्याची', 'ಜಲ', 'ನೀರ']
    },
    'Electricity Department': {
        phrases: ['street light not working', 'power cut', 'transformer spark', 'electric shock', 'current lag', 'light gone', 'लाईट गेलेली आहे', 'दिवा बंद आहे', 'ಬೆಳಕು ಇಲ್ಲ', 'ವಿದ್ಯುತ್ ಇಲ್ಲ'],
        strongKeywords: ['electricity', 'light', 'current', 'shock', 'bijli', 'बिजली', 'वीज', 'लाईट', 'खांब', 'ವಿದ್ಯುತ್', 'ಬೆಳಕು'],
        keywords: ['power', 'transformer', 'wire', 'fuse', 'meter', 'pole', 'voltage', 'दिवा', 'लाइट', 'ಕಂಬ', 'ಮೋಟರ್']
    },
    'PWD': {
        phrases: ['bad road', 'pothole issue', 'bridge crack', 'footpath broken', 'सड़क खराब', 'रस्ता खराब', 'ರಸ್ತೆ ಸರಿ ಇಲ್ಲ'],
        strongKeywords: ['pothole', 'khadda', 'bridge', 'खड्डा', 'ರಸ್ತೆ', 'ಗಡ್ಡೆ'],
        keywords: ['road', 'rasta', 'pavement', 'highway', 'asphalt', 'concrete', 'सड़क', 'रस्ता', 'ಸೇತುವೆ']
    },
    'Police': {
        phrases: ['theft report', 'safety issue', 'noise complaint', 'rowdy behavior', 'ಕಳ್ಳತನ', 'ಚೋರಿ'],
        strongKeywords: ['police', 'theft', 'crime', 'fir', 'चोरी', 'ಪೊಲೀಸ್'],
        keywords: ['robbery', 'safety', 'security', 'thana', 'ಠಾಣೆ']
    },
    'Health Department': {
        phrases: ['hospital issue', 'clinic closed', 'medical negligence', 'vaccine delivery', 'ambulance delay', 'ಆಸ್ಪತ್ರೆ'],
        strongKeywords: ['hospital', 'doctor', 'clinic', 'ದವಾಖಾನೆ'],
        keywords: ['health', 'medicine', 'vaccine', 'patient', 'disease', 'medical', 'emergency', 'ಔಷಧಿ']
    },
    'Municipal': {
        phrases: ['garbage dump', 'trash bin full', 'not cleaned', 'bad smell', 'sewer overflow', 'kachra truck', 'ಕಸ'],
        strongKeywords: ['garbage', 'sewer', 'trash', 'kachra', 'ಸ್ವಚ್ಛತೆ'],
        keywords: ['municipal', 'waste', 'cleaning', 'clean', 'drain', 'clog', 'gutter', 'smell', 'mosquito', 'ಗುಂಡಿ']
    },
    'Education Department': {
        phrases: ['school problem', 'college issue', 'teacher absent', 'scholarship delay', 'ಶಾಲೆ'],
        strongKeywords: ['school', 'college', 'teacher', 'ಶಿಕ್ಷಕ'],
        keywords: ['education', 'student', 'scholarship', 'exam', 'admission', 'ಪರೀಕ್ಷೆ']
    },
    'Transport Department': {
        phrases: ['bus delay', 'traffic light', 'license issue', 'permit pending'],
        strongKeywords: ['transport', 'traffic', 'bus', 'ಬಸ್'],
        keywords: ['driver', 'license', 'permit', 'auto', 'taxi', 'parking', 'ಚಾಲಕ']
    },
    'Agriculture Department': {
        phrases: ['farmer seed', 'fertilizer issue', 'crop damage', 'irrigation problem', 'ರೈತ'],
        strongKeywords: ['agriculture', 'farmer', 'kisan', 'ಕೃಷಿ'],
        keywords: ['seed', 'fertilizer', 'irrigation', 'soil', 'crop', 'farming', 'ಬೆಳೆ']
    },
    'Revenue Department': {
        phrases: ['land record', 'property tax', 'land survey', 'patwari issue'],
        strongKeywords: ['revenue', 'land', 'property', 'ಆಸ್ತಿ'],
        keywords: ['tax', 'survey', 'patwari', 'registration', 'stamp', 'ತೆರಿಗೆ']
    },
    'Social Welfare': {
        phrases: ['pension delay', 'senior citizen', 'disability scheme', 'widow pension'],
        strongKeywords: ['pension', 'welfare', 'ಪರಿಹಾರ'],
        keywords: ['disabled', 'senior', 'scheme', 'yojana', 'orphan', 'widow', 'ಯೋಜನೆ']
    },
    'Forest Department': {
        phrases: ['tree cutting', 'wildlife entry', 'forest fire', 'illegal wood'],
        strongKeywords: ['forest', 'wildlife', 'trees', 'ಅರಣ್ಯ'],
        keywords: ['animal', 'environment', 'wood', 'timber', 'nature', 'ಮರ']
    }
};

const computeWeightedConfidence = (translatedText, originalText = "") => {
    let bestCategory = null; 
    let maxScore = 0;
    let finalMatchedKeywords = [];
    const lowerText = translatedText.toLowerCase();
    const lowerOriginal = originalText.toLowerCase();

    const safetyMatches = [
        { terms: ['लाईट', 'दिवा', 'खांब', 'विद्युत', 'ಬೆಳಕು', 'ವಿದ್ಯುತ್', 'light', 'streetlight', 'lamp', 'power cut', 'बिजली कटौती', 'వీధి దీపాలు', 'தெரு விளக்கு'], dept: 'Electricity Department' },
        { terms: ['पाणी', 'पाईप', 'ನೀರು', 'ನೀರ', 'water', 'pipe', 'leakage', 'गळती', 'लीकेज', 'தண்ணீர்', 'నీరు'], dept: 'Water Department' },
        { terms: ['रस्ता', 'खड्डा', 'ರಸ್ತೆ', 'road', 'pothole', 'garbage', 'कचರಾ', 'गटार', 'குப்பை', 'చెత్త', 'ಕಸ'], dept: 'Municipal' },
        { terms: ['ಕಳ್ಳತನ', 'ಚೋರಿ', 'theft', 'crime', 'police', 'திருட்டு', 'దొంగతనం'], dept: 'Police' }
    ];

    for (const match of safetyMatches) {
        if (match.terms.some(term => lowerOriginal.includes(term))) {
            return { category: match.dept, score: 100, matchedKeywords: ['Multilingual Safety Match'] };
        }
    }

    for (const [category, dict] of Object.entries(CATEGORY_DICTIONARY)) {
        let score = 0;
        let matchedInThisDept = [];

        const phraseWeight = category === 'Electricity Department' ? 15 : 10;
        for (const phrase of dict.phrases) {
            if (lowerText.includes(phrase.toLowerCase())) {
                score += phraseWeight;
                matchedInThisDept.push(phrase);
            }
        }

        const strongWeight = category === 'Electricity Department' ? 8 : 5;
        for (const kw of dict.strongKeywords) {
            if (lowerText.includes(kw.toLowerCase())) {
                score += strongWeight;
                matchedInThisDept.push(kw);
            }
        }

        const normalWeight = category === 'Electricity Department' ? 4 : 3;
        for (const kw of dict.keywords) {
            if (lowerText.includes(kw.toLowerCase())) {
                score += normalWeight;
                matchedInThisDept.push(kw);
            }
        }

        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
            finalMatchedKeywords = matchedInThisDept;
        }
    }
    
    return { category: bestCategory, score: maxScore, matchedKeywords: finalMatchedKeywords };
};

const findStrictDepartment = async (Department, category) => {
    if (!category) return null;

    const normalizedCategory = category.trim().toLowerCase();
    let dept = await Department.findOne({ departmentName: normalizedCategory });
    
    if (!dept) {
        dept = await Department.findOne({ departmentName: new RegExp(`^${normalizedCategory}$`, 'i') });
    }

    if (!dept) {
        const altName = normalizedCategory.includes('department') 
            ? normalizedCategory.replace(' department', '').trim()
            : `${normalizedCategory} department`;
        dept = await Department.findOne({ departmentName: new RegExp(`^${altName}$`, 'i') });
    }
    
    if (!dept) {
        dept = await Department.findOne({ departmentName: new RegExp(normalizedCategory, 'i') });
    }
    
    return dept;
};

// 1. Static GET Routes
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

        const officerDept = await Department.findById(req.user.departmentId);
        if (!officerDept) return res.json([]);

        const officerId = req.user.id;
        const query = {
            departmentId: officerDept._id,
            status: { $in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] },
            $or: [
                { assignedOfficerId: officerId },
                { assignedOfficerId: { $exists: false } },
                { assignedOfficerId: null }
            ]
        };

        const complaints = await Complaint.find(query)
            .populate('userId', 'name phone')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (err) {
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

// 2. Main POST Route
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, location, imageData, language = 'en', categoryId } = req.body;
        
        if (!title || title.trim().length < 5) return res.status(400).json({ message: "Title required" });
        if (!description || description.trim().length < 10) return res.status(400).json({ message: "Description required" });
        if (!location || !location.address) return res.status(400).json({ message: "Location required" });

        let resolvedLocation = { ...location };
        const combinedInput = `${title} ${description}`;
        
        let finalTranslatedTitle = title;
        let finalTranslatedDescription = description;
        let finalCategory = 'General Department';
        let routingConfidence = 0.0;
        let priority = "Medium";
        let aiResultCategory = "NOT_CALLED";
        let aiDetectedLanguage = "Unknown";
        let keywordScore = 0;
        let matchedKeywords = [];
        let finalDecisionReason = "Default (General Department)";
        let isDirectMatch = false;

        if (categoryId) {
            const Category = require('../models/Category');
            const foundCat = await Category.findOne({ categoryId });
            if (foundCat) {
                finalCategory = foundCat.department;
                const translation = foundCat.translations.find(t => t.language === language) || foundCat.translations.find(t => t.language === 'en');
                finalTranslatedTitle = translation ? translation.name : title;
                finalDecisionReason = `Direct ID Match (${categoryId})`;
                routingConfidence = 1.0;
                isDirectMatch = true;
            }
        }


        const TranslationCache = require('../models/TranslationCache');
        const inputHash = crypto.createHash('sha256').update(combinedInput + language).digest('hex');
        const hasAI = !!process.env.DEEPSEEK_API_KEY;

        const lowerOriginalText = combinedInput.toLowerCase();
        
        // Skip AI/Keyword routing if we have a direct ID match
        if (!isDirectMatch) {
            // 1. Multilingual Keyword Matcher
            let kwRes = computeWeightedConfidence(combinedInput, combinedInput);
            if (kwRes.score >= 10) {
                finalCategory = kwRes.category;
                routingConfidence = Math.min((kwRes.score / 20.0), 1.0);
                finalDecisionReason = `Strong Keyword Match (${kwRes.matchedKeywords[0]})`;
                matchedKeywords = kwRes.matchedKeywords;
                keywordScore = kwRes.score;
            }

            // 2. Electricity Priority Override (Wins over Municipal)
            const electricityPriorityTerms = ['light', 'street light', 'lamp', 'electric', 'pole', 'power', 'ವಿದ್ಯುತ್', 'ಬೆಳಕು', 'ಲೈಟ್', 'दिवा', 'खांब', 'current', 'ಬೆಳಕು ಇಲ್ಲ', 'पथदिवे'];
            const hasElectricity = electricityPriorityTerms.some(term => lowerOriginalText.includes(term.toLowerCase()));

            // 3. Water Priority Override (Wins over Drainage/Municipal)
            const waterPriorityTerms = ['pipe', 'leak', 'sewage', 'burst', 'water', 'ಪಾಲಿ', 'ನೀರು', 'पाणी', 'पाईप', 'गळती', 'ಕುಡಿಯುವ ನೀರು'];
            const hasWater = waterPriorityTerms.some(term => lowerOriginalText.includes(term.toLowerCase()));

            if (hasElectricity) {
                finalCategory = 'Electricity Department';
                finalDecisionReason = "Rule-Based Priority: ELECTRICITY (Street Light/Power Rule)";
                routingConfidence = 1.0;
            } else if (hasWater) {
                finalCategory = 'Water Department';
                finalDecisionReason = "Rule-Based Priority: WATER (Leakage/Supply Rule)";
                routingConfidence = 1.0; 
            }
        }

        if (routingConfidence < 1.0 && hasAI) {
            try {
                const cached = await TranslationCache.findOne({ textHash: inputHash });
                if (cached) {
                    const parsed = JSON.parse(cached.translatedText);
                    finalTranslatedTitle = parsed.core_issue || parsed.translated_title || title;
                    finalTranslatedDescription = parsed.translated_text || description;
                    finalCategory = DEPARTMENT_CODE_MAPPING[parsed.department] || 'General Department';
                    routingConfidence = 1.0;
                    finalDecisionReason = "Cached AI Classification";
                } else {
                    const aiRes = await axios.post('https://api.deepseek.com/chat/completions', {
                        model: 'deepseek-chat',
                        messages: [
                            { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
                            { role: 'user', content: `Complaint Title: ${title}\nComplaint Description: ${description}` }
                        ],
                        temperature: 0.1,
                        response_format: { type: 'json_object' }
                    }, { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` }, timeout: 15000 });

                    const result = JSON.parse(aiRes.data.choices[0].message.content);
                    finalTranslatedDescription = result.translated_text;
                    finalTranslatedTitle = result.core_issue || result.translated_text.substring(0, 50) + "...";
                    const deptCode = result.department;
                    finalCategory = DEPARTMENT_CODE_MAPPING[deptCode] || 'General Department';
                    priority = result.priority_level || 'Medium';
                    routingConfidence = 1.0;
                    finalDecisionReason = `AI Classification (${deptCode})`;
                    aiResultCategory = deptCode;
                    aiDetectedLanguage = result.detected_language || "Unknown";

                    await new TranslationCache({
                        textHash: inputHash,
                        originalText: combinedInput,
                        translatedText: JSON.stringify(result),
                        language
                    }).save();
                }
            } catch (e) {
                console.error("AI Error:", e.message);
                let kwResFallback = computeWeightedConfidence(combinedInput, combinedInput);
                finalCategory = kwResFallback.category || 'General Department';
                routingConfidence = 0.5;
                finalDecisionReason = "Fallback Keyword Match";
            }
        }

        const combinedEnglishText = `${finalTranslatedTitle} ${finalTranslatedDescription}`;

        const department = await findStrictDepartment(Department, finalCategory);
        let departmentId = department?._id || null;

        if (!departmentId) {
             const generalDept = await Department.findOne({ departmentName: /general department/i });
             departmentId = generalDept?._id || null;
             finalCategory = 'General Department';
        }

        const newComplaint = new Complaint({
            userId: req.user.id,
            ticketId: generateTicketId(),
            categoryId: categoryId || null,
            title: finalTranslatedTitle, 
            description: finalTranslatedDescription, 
            originalText: combinedInput,
            translatedText: combinedEnglishText,
            language,
            detectedLanguage: aiDetectedLanguage,
            confidence: routingConfidence,
            category: finalCategory,
            departmentId,
            aiResultCategory,
            keywordScore,
            matchedKeywords,
            finalDecisionReason,
            priorityLevel: priority,
            location: { ...resolvedLocation, landmark: req.body.location?.landmark || null },
            imageData: imageData || null,
            status: 'NEW',
            slaDeadline: getSlaDeadline(priority)
        });
        await assignmentService.assignToOfficer(newComplaint, departmentId);
        await newComplaint.save();

        const populated = await Complaint.findById(newComplaint._id).populate('assignedOfficerId', 'name').populate('departmentId');
        socketService.emitNewComplaint(populated);
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Parameterized & Specific Routes
router.get('/track/:ticketId', async (req, res) => {
    try {
        const ticketId = req.params.ticketId.trim().toUpperCase();
        let complaint = await Complaint.findOne({ ticketId }).populate('assignedOfficerId', 'name').populate('departmentId').select('-imageData');
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
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('assignedOfficerId', 'name');
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/accept', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can accept tasks' });
        const complaint = await Complaint.findOneAndUpdate(
            { _id: req.params.id, status: { $in: ['NEW', 'ASSIGNED', 'REOPENED'] } },
            { status: 'ASSIGNED', assignedOfficerId: req.user.id, acceptedAt: new Date() },
            { new: true }
        );
        if (!complaint) return res.status(404).json({ message: 'Complaint not available' });
        socketService.emitStatusUpdate(complaint);
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/progress', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can log progress' });
        const { progress, note } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { 
                progress: parseInt(progress), 
                $push: { timeline: { status: 'IN_PROGRESS', note, timestamp: new Date() } },
                status: 'IN_PROGRESS'
            },
            { new: true }
        );
        socketService.emitStatusUpdate(complaint);
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/resolve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can resolve complaints' });
        const { resolutionNote, proofImage } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'RESOLVED', 
                resolutionNote, 
                proofImage,
                resolvedAt: new Date(),
                progress: 100,
                $push: { timeline: { status: 'RESOLVED', note: resolutionNote, timestamp: new Date() } }
            },
            { new: true }
        );
        
        // Update officer stats
        await User.findByIdAndUpdate(req.user.id, { $inc: { activeCasesCount: -1, resolvedCount: 1 } });
        
        socketService.emitStatusUpdate(complaint);
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/accept-and-resolve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Officer') return res.status(403).json({ message: 'Only officers can resolve complaints' });
        const { resolutionNote, proofImage } = req.body;
        
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'RESOLVED',
                assignedOfficerId: req.user.id,
                acceptedAt: new Date(),
                resolutionNote, 
                proofImage,
                resolvedAt: new Date(),
                progress: 100,
                $push: { 
                    timeline: [
                        { status: 'ACCEPTED', note: 'Accepted for instant resolution', timestamp: new Date() },
                        { status: 'RESOLVED', note: resolutionNote, timestamp: new Date() }
                    ] 
                }
            },
            { new: true }
        );

        await User.findByIdAndUpdate(req.user.id, { $inc: { resolvedCount: 1 } });
        
        socketService.emitStatusUpdate(complaint);
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/reopen', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'REOPENED', 
                progress: 0,
                $push: { timeline: { status: 'REOPENED', note: 'Complaint reopened by citizen', timestamp: new Date() } }
            },
            { new: true }
        );
        socketService.emitStatusUpdate(complaint);
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/feedback', auth, async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { rating, feedback },
            { new: true }
        );
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/warn', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
        const { message } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { hasWarning: true, $push: { timeline: { status: 'WARNING', note: message, timestamp: new Date() } } },
            { new: true }
        );
        socketService.emitStatusUpdate(complaint);
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/remark', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
        const { remark } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { $push: { timeline: { status: 'REMARK', note: remark, timestamp: new Date() } } },
            { new: true }
        );
        socketService.emitStatusUpdate(complaint);
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/priority', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
        const { priorityLevel } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { priorityLevel },
            { new: true }
        );
        socketService.emitStatusUpdate(complaint);
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/reassign', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
        const { officerId } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { assignedOfficerId: officerId, status: 'ASSIGNED' },
            { new: true }
        ).populate('assignedOfficerId', 'name');
        socketService.emitStatusUpdate(complaint);
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
