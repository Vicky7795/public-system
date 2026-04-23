require('dotenv').config({ path: './.env' });
const axios = require('axios');

async function testClassification(title, description) {
    const CLASSIFICATION_SYSTEM_PROMPT = `You are an advanced AI system for classifying citizen complaints into the correct government department.
You MUST follow ALL steps strictly.
STEP 1: LANGUAGE DETECTION (MANDATORY)
STEP 2: TRANSLATION (MANDATORY)
STEP 3: INTENT UNDERSTANDING
STEP 4: DEPARTMENT CLASSIFICATION (STRICT)
STRICT MAPPING RULES:
ELECTRICITY, WATER, MUNICIPAL, POLICE, HEALTH, TRANSPORT, EDUCATION, AGRICULTURE, REVENUE, FOREST, SOCIAL_WELFARE
FINAL OUTPUT FORMAT (STRICT JSON ONLY):
{
  "detected_language": "<language>",
  "translated_text": "<clear English sentence>",
  "department": "<ONE department name>",
  "confidence": <0 to 1>
}`;

    try {
        console.log(`Testing Input: ${title} / ${description}`);
        const aiRes = await axios.post('https://api.deepseek.com/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
                { role: 'user', content: `Complaint Title: ${title}\nComplaint Description: ${description}` }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        }, { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } });

        const result = JSON.parse(aiRes.data.choices[0].message.content);
        console.log('AI Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Test Failed:', e.response?.data || e.message);
    }
}

// Test Case 1: Tamil Water Issue
testClassification("தண்ணீர் வரவில்லை", "எங்கள் பகுதியில் கடந்த இரண்டு நாட்களாக தண்ணீர் வரவில்லை.");

// Test Case 2: Telugu Street Light
testClassification("వీధి దీపాలు పనిచేయడం లేదు", "మా వీధిలో వీధి దీపాలు పనిచేయడం లేదు, దయచేసి బాగు చేయండి.");
