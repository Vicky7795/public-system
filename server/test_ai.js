require('dotenv').config({ path: './server/.env' });
const axios = require('axios');

async function testClassification(title, description) {
    const CLASSIFICATION_SYSTEM_PROMPT = `You are an intelligent AI system designed to classify citizen complaints into the correct government department.

Your task is to:
1. Understand the complaint in ANY language (English, Hindi, Marathi, Tamil, Telugu, Kannada, etc.)
2. Translate it internally to English if needed
3. Identify the correct department STRICTLY from the list below
4. Never guess randomly
5. If unsure, return "GENERAL"

-----------------------------------
AVAILABLE DEPARTMENTS:
1. ELECTRICITY
2. WATER
3. MUNICIPAL
4. HEALTH
5. AGRICULTURE
6. TRANSPORT
7. POLICE
8. EDUCATION
9. SOCIAL_WELFARE
10. REVENUE
11. FOREST

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "translated_text": "<translated English complaint>",
  "department": "<ONE from list OR GENERAL>",
  "confidence": <number between 0 and 1>
}

CONFIDENCE RULES:
- Clear match → 0.85 - 0.99
- Partial match → 0.6 - 0.8
- Not sure → below 0.6 → return "GENERAL"`;

    try {
        console.log(`Testing Input: ${title} / ${description}`);
        const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
                { role: 'user', content: `Complaint Title: ${title}\nComplaint Description: ${description}` }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        }, { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } });

        const result = JSON.parse(aiRes.data.choices[0].message.content);
        console.log('AI Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Test Failed:', e.response?.data || e.message);
    }
}

// Test Case 1: Marathi Street Light
testClassification("पथदिवे बंद आहेत", "आमच्या गल्लीतील सर्व पथदिवे गेल्या ३ दिवसांपासून बंद आहेत, कृपया दुरुस्त करा.");

// Test Case 2: Water Leakage
testClassification("पाणी गळती", "मुख्य रस्त्यावरील पाण्याची पाईपलाईन फुटली आहे आणि पाणी वाया जात आहे.");

// Test Case 3: Random/General
testClassification("Hello", "This is just a test message to see what happens.");
