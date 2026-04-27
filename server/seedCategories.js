const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Category = require('./models/Category');

const categories = [
    // Electricity Department
    {
        categoryId: 'elec_streetlight',
        department: 'Electricity Department',
        translations: [
            { language: 'en', name: 'Streetlight not working' },
            { language: 'kn', name: 'ಬೀದಿ ದೀಪ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ' },
            { language: 'hi', name: 'स्ट्रीट लाइट काम नहीं कर रही' },
            { language: 'mr', name: 'रस्त्यावरील दिवा खराब' },
            { language: 'ta', name: 'தெரு விளக்கு பழுதானது' },
            { language: 'te', name: 'వీధి దీపం పనిచేయడం లేదు' },
            { language: 'ml', name: 'തെരുവ് വിളക്ക് കത്തുന്നില്ല' },
            { language: 'gu', name: 'સ્ટ્રીટલાઇટ ચાલતી નથી' },
            { language: 'pa', name: 'ਸਟ੍ਰੀਟ ਲਾਈਟ ਕੰਮ ਨਹੀਂ ਕਰ ਰਹੀ' }
        ]
    },
    {
        categoryId: 'elec_power_outage',
        department: 'Electricity Department',
        translations: [
            { language: 'en', name: 'Power outage' },
            { language: 'kn', name: 'ವಿದ್ಯುತ್ ವ್ಯತ್ಯಯ' },
            { language: 'hi', name: 'बिजली कटौती' },
            { language: 'mr', name: 'वीज पुरवठा खंडित' },
            { language: 'ta', name: 'மின் தடை' },
            { language: 'te', name: 'విద్యుత్ కోత' },
            { language: 'ml', name: 'വൈദ്യുതി തടസ്സം' },
            { language: 'gu', name: 'વીજળી કાપ' },
            { language: 'pa', name: 'ਬਿਜਲੀ ਕੱਟ' }
        ]
    },
    {
        categoryId: 'elec_pole_damage',
        department: 'Electricity Department',
        translations: [
            { language: 'en', name: 'Electric pole damage' },
            { language: 'kn', name: 'ವಿದ್ಯುತ್ ಕಂಬ ಹಾನಿ' },
            { language: 'hi', name: 'बिजली के खंभे की क्षति' },
            { language: 'mr', name: 'विजेच्या खांबाचे नुकसान' },
            { language: 'ta', name: 'மின் கம்பம் சேதம்' },
            { language: 'te', name: 'విద్యుత్ స్తంభం దెబ్బతింది' },
            { language: 'ml', name: 'വൈദ്യുതി പോസ്റ്റ് കേടുപാടുകൾ' },
            { language: 'gu', name: 'વીજળીના થાંભલાને નુકસાન' },
            { language: 'pa', name: 'ਬਿਜਲੀ ਦੇ ਖੰਭੇ ਦਾ ਨੁਕਸਾਨ' }
        ]
    },

    // Water Department
    {
        categoryId: 'water_leakage',
        department: 'Water Department',
        translations: [
            { language: 'en', name: 'Water leakage' },
            { language: 'kn', name: 'ನೀರು ಸೋರಿಕೆ' },
            { language: 'hi', name: 'पानी का रिसाव' },
            { language: 'mr', name: 'पाणी गळती' },
            { language: 'ta', name: 'தண்ணீர் கசிவு' },
            { language: 'te', name: 'నీటి లీకేజీ' },
            { language: 'ml', name: 'ജലചോർച്ച' },
            { language: 'gu', name: 'પાણીનું લીકેજ' },
            { language: 'pa', name: 'ਪਾਣੀ ਦਾ ਰਿਸਾਅ' }
        ]
    },
    {
        categoryId: 'water_no_supply',
        department: 'Water Department',
        translations: [
            { language: 'en', name: 'No water supply' },
            { language: 'kn', name: 'ನೀರು ಸರಬರಾಜು ಇಲ್ಲ' },
            { language: 'hi', name: 'पानी की आपूर्ति नहीं' },
            { language: 'mr', name: 'पाणीपुरवठा नाही' },
            { language: 'ta', name: 'தண்ணீர் விநியோகம் இல்லை' },
            { language: 'te', name: 'నీటి సరఫరా లేదు' },
            { language: 'ml', name: 'ജലവിതരണം ഇല്ല' },
            { language: 'gu', name: 'પાણીનો પુરવઠો નથી' },
            { language: 'pa', name: 'ਪਾਣੀ ਦੀ ਸਪਲਾਈ ਨਹੀਂ' }
        ]
    },
    {
        categoryId: 'water_drainage',
        department: 'Water Department',
        translations: [
            { language: 'en', name: 'Drainage issue' },
            { language: 'kn', name: 'ಚರಂಡಿ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'जल निकासी की समस्या' },
            { language: 'mr', name: 'सांडपाणी समस्या' },
            { language: 'ta', name: 'கழிவுநீர் பிரச்சனை' },
            { language: 'te', name: 'డ్రైనేజీ సమస్య' },
            { language: 'ml', name: 'സീവേജ് പ്രശ്നം' },
            { language: 'gu', name: 'ડ્રેનેજ સમસ્યા' },
            { language: 'pa', name: 'ਡਰੇਨੇਜ ਦੀ ਸਮੱਸਿਆ' }
        ]
    },

    // Municipal Department
    {
        categoryId: 'muni_garbage',
        department: 'Municipal Department',
        translations: [
            { language: 'en', name: 'Garbage collection' },
            { language: 'kn', name: 'ಕಸ ಸಂಗ್ರಹಣೆ' },
            { language: 'hi', name: 'कचरा संग्रहण' },
            { language: 'mr', name: 'कचरा संकलन' },
            { language: 'ta', name: 'குப்பை சேகரிப்பு' },
            { language: 'te', name: 'చెత్త సేకరణ' },
            { language: 'ml', name: 'മാലിന്യ ശേഖരണം' },
            { language: 'gu', name: 'કચરો ઉપાડવો' },
            { language: 'pa', name: 'ਕੂੜਾ ਇਕੱਠਾ ਕਰਨਾ' }
        ]
    },
    {
        categoryId: 'muni_road_cleaning',
        department: 'PWD',
        translations: [
            { language: 'en', name: 'Road cleaning' },
            { language: 'kn', name: 'ರಸ್ತೆ ಸ್ವಚ್ಛಗೊಳಿಸುವಿಕೆ' },
            { language: 'hi', name: 'सड़क की सफाई' },
            { language: 'mr', name: 'रस्त्यांची स्वच्छता' },
            { language: 'ta', name: 'சாலை சுத்தம் செய்தல்' },
            { language: 'te', name: 'రోడ్డు శుభ్రపరచడం' },
            { language: 'ml', name: 'റോഡ് വൃത്തിയാക്കൽ' },
            { language: 'gu', name: 'રોડ સફાઈ' },
            { language: 'pa', name: 'ਸੜਕ ਦੀ ਸਫਾਈ' }
        ]
    },
    {
        categoryId: 'muni_public_toilet',
        department: 'Municipal Department',
        translations: [
            { language: 'en', name: 'Public toilet issue' },
            { language: 'kn', name: 'ಸಾರ್ವಜನಿಕ ಶೌಚಾಲಯದ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'सार्वजनिक शौचालय की समस्या' },
            { language: 'mr', name: 'सार्वजनिक शौचालय समस्या' },
            { language: 'ta', name: 'பொது கழிப்பறை பிரச்சனை' },
            { language: 'te', name: 'పబ్లిక్ టాయిలెట్ సమస్య' },
            { language: 'ml', name: 'പൊതു ശൗചാലയ പ്രശ്നം' },
            { language: 'gu', name: 'જાહેર શૌચાલયની સમસ્યા' },
            { language: 'pa', name: 'ਪਬਲਿਕ ਪਖਾਨੇ ਦੀ ਸਮੱਸਿਆ' }
        ]
    },

    // PWD
    {
        categoryId: 'pwd_road_damage',
        department: 'PWD',
        translations: [
            { language: 'en', name: 'Road damage' },
            { language: 'kn', name: 'ರಸ್ತೆ ಹಾನಿ' },
            { language: 'hi', name: 'सड़क की क्षति' },
            { language: 'mr', name: 'रस्त्याचे नुकसान' },
            { language: 'ta', name: 'சாலை சேதம்' },
            { language: 'te', name: 'రోడ్డు దెబ్బతింది' },
            { language: 'ml', name: 'റോഡ് തകരാർ' },
            { language: 'gu', name: 'રોડ નુકસાન' },
            { language: 'pa', name: 'ਸੜਕ ਦਾ ਨੁਕਸਾਨ' }
        ]
    },
    {
        categoryId: 'pwd_potholes',
        department: 'PWD',
        translations: [
            { language: 'en', name: 'Potholes' },
            { language: 'kn', name: 'ರಸ್ತೆ ಗುಂಡಿಗಳು' },
            { language: 'hi', name: 'सड़क के गड्ढे' },
            { language: 'mr', name: 'खड्डे' },
            { language: 'ta', name: 'குழிகள்' },
            { language: 'te', name: 'రోడ్డు గుంతలు' },
            { language: 'ml', name: 'കുഴികൾ' },
            { language: 'gu', name: 'ખાડાઓ' },
            { language: 'pa', name: 'ਟੋਏ' }
        ]
    },
    {
        categoryId: 'pwd_bridge_repair',
        department: 'PWD',
        translations: [
            { language: 'en', name: 'Bridge repair' },
            { language: 'kn', name: 'ಸೇತುವೆ ದುರಸ್ತಿ' },
            { language: 'hi', name: 'पुल की मरम्मत' },
            { language: 'mr', name: 'पुलाची दुरुस्ती' },
            { language: 'ta', name: 'பாலம் பழுது' },
            { language: 'te', name: 'వంతెన మరమ్మతు' },
            { language: 'ml', name: 'പാലം അറ്റകുറ്റപ്പണി' },
            { language: 'gu', name: 'પુલ રિપેરિંગ' },
            { language: 'pa', name: 'ਪੁਲ ਦੀ ਮੁਰੰਮਤ' }
        ]
    },

    // Health Department
    {
        categoryId: 'health_hospital',
        department: 'Health Department',
        translations: [
            { language: 'en', name: 'Hospital issue' },
            { language: 'kn', name: 'ಆಸ್ಪತ್ರೆ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'अस्पताल की समस्या' },
            { language: 'mr', name: 'रुग्णालय समस्या' },
            { language: 'ta', name: 'மருத்துவமனை பிரச்சனை' },
            { language: 'te', name: 'ఆసుపత్రి సమస్య' },
            { language: 'ml', name: 'ആശുപത്രി പ്രശ്നം' },
            { language: 'gu', name: 'હોસ્પિટલ સમસ્યા' },
            { language: 'pa', name: 'ਹਸਪਤਾਲ ਦੀ ਸਮੱਸਿਆ' }
        ]
    },
    {
        categoryId: 'health_emergency',
        department: 'Health Department',
        translations: [
            { language: 'en', name: 'Medical emergency support' },
            { language: 'kn', name: 'ವೈದ್ಯಕೀಯ ತುರ್ತು ಬೆಂಬಲ' },
            { language: 'hi', name: 'चिकित्सा आपातकालीन सहायता' },
            { language: 'mr', name: 'वैद्यकीय आपत्कालीन मदत' },
            { language: 'ta', name: 'மருத்துவ அவசர உதவி' },
            { language: 'te', name: 'వైద్య అత్యవసర సహాయం' },
            { language: 'ml', name: 'മെഡിക്കൽ എമർജൻസി സഹായം' },
            { language: 'gu', name: 'તબીબી કટોકટી સહાય' },
            { language: 'pa', name: 'ਮੈਡੀਕਲ ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ' }
        ]
    },
    {
        categoryId: 'health_sanitation',
        department: 'Health Department',
        translations: [
            { language: 'en', name: 'Sanitation issue' },
            { language: 'kn', name: 'ನೈರ್ಮಲ್ಯ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'स्वच्छता समस्या' },
            { language: 'mr', name: 'स्वच्छता समस्या' },
            { language: 'ta', name: 'சுகாதார பிரச்சனை' },
            { language: 'te', name: 'పారిశుధ్య సమస్య' },
            { language: 'ml', name: 'ശുചിത്വ പ്രശ്നം' },
            { language: 'gu', name: 'સ્વચ્છતા મુદ્દો' },
            { language: 'pa', name: 'ਸਵੱਛਤਾ ਮੁੱਦਾ' }
        ]
    },

    // Education Department
    {
        categoryId: 'edu_infrastructure',
        department: 'Education Department',
        translations: [
            { language: 'en', name: 'School infrastructure issue' },
            { language: 'kn', name: 'ಶಾಲಾ ಮೂಲಸೌಕರ್ಯ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'स्कूल के बुनियादी ढांचे की समस्या' },
            { language: 'mr', name: 'शाळेच्या पायाभूत सुविधांची समस्या' },
            { language: 'ta', name: 'பள்ளி உள்கட்டமைப்பு பிரச்சனை' },
            { language: 'te', name: 'పాఠశాల మౌలిక సదుపాయాల సమస్య' },
            { language: 'ml', name: 'സ്കൂൾ ഇൻഫ്രാസ്ട്രക്ചർ പ്രശ്നം' },
            { language: 'gu', name: 'શાળા ઇન્ફ્રાસ્ટ્રક્ચર સમસ્યા' },
            { language: 'pa', name: 'ਸਕੂਲ ਬੁਨਿਆਦੀ ਢਾਂਚਾ ਮੁੱਦਾ' }
        ]
    },
    {
        categoryId: 'edu_teacher_complaint',
        department: 'Education Department',
        translations: [
            { language: 'en', name: 'Teacher complaint' },
            { language: 'kn', name: 'ಶಿಕ್ಷಕರ ದೂರು' },
            { language: 'hi', name: 'शिक्षक की शिकायत' },
            { language: 'mr', name: 'शिक्षकाची तक्रार' },
            { language: 'ta', name: 'ஆசிரியர் புகார்' },
            { language: 'te', name: 'ఉపాధ్యాయుడిపై ఫిర్యాదు' },
            { language: 'ml', name: 'അധ്യാപക പരാതി' },
            { language: 'gu', name: 'શિક્ષકની ફરિયાદ' },
            { language: 'pa', name: 'ਅਧਿਆਪਕ ਦੀ ਸ਼ਿਕਾਇਤ' }
        ]
    },

    // Agriculture Department
    {
        categoryId: 'agri_crop_issue',
        department: 'Agriculture Department',
        translations: [
            { language: 'en', name: 'Crop issue' },
            { language: 'kn', name: 'ಬೆಳೆ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'फसल की समस्या' },
            { language: 'mr', name: 'पीक समस्या' },
            { language: 'ta', name: 'பயிர் பிரச்சனை' },
            { language: 'te', name: 'పంట సమస్య' },
            { language: 'ml', name: 'കൃഷി പ്രശ്നം' },
            { language: 'gu', name: 'પાક સમસ્યા' },
            { language: 'pa', name: 'ਫਸਲ ਦੀ ਸਮੱਸਿਆ' }
        ]
    },
    {
        categoryId: 'agri_irrigation',
        department: 'Agriculture Department',
        translations: [
            { language: 'en', name: 'Irrigation problem' },
            { language: 'kn', name: 'ನೀರಾವರಿ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'सिंचाई की समस्या' },
            { language: 'mr', name: 'सिंचन समस्या' },
            { language: 'ta', name: 'பாசன பிரச்சனை' },
            { language: 'te', name: 'నీటి పారుదల సమస్య' },
            { language: 'ml', name: 'ജലസേചന പ്രശ്നം' },
            { language: 'gu', name: 'સિંચાઈની સમસ્યા' },
            { language: 'pa', name: 'ਸਿੰਚਾਈ ਦੀ ਸਮੱਸਿਆ' }
        ]
    },

    // Transport Department
    {
        categoryId: 'trans_bus_service',
        department: 'Transport Department',
        translations: [
            { language: 'en', name: 'Bus service issue' },
            { language: 'kn', name: 'ಬಸ್ ಸೇವೆ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'बस सेवा की समस्या' },
            { language: 'mr', name: 'बस सेवा समस्या' },
            { language: 'ta', name: 'பேருந்து சேவை பிரச்சனை' },
            { language: 'te', name: 'బస్సు సర్వీస్ సమస్య' },
            { language: 'ml', name: 'ബസ് സർവീസ് പ്രശ്നം' },
            { language: 'gu', name: 'બસ સેવા સમસ્યા' },
            { language: 'pa', name: 'ਬੱਸ ਸੇਵਾ ਦਾ ਮੁੱਦਾ' }
        ]
    },
    {
        categoryId: 'trans_traffic_signal',
        department: 'Transport Department',
        translations: [
            { language: 'en', name: 'Traffic signal issue' },
            { language: 'kn', name: 'ಟ್ರಾಫಿಕ್ ಸಿಗ್ನಲ್ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'ट्रैफिक सिग्नल की समस्या' },
            { language: 'mr', name: 'रहदारी सिग्नल समस्या' },
            { language: 'ta', name: 'போக்குவரத்து சமிக்ஞை பிரச்சனை' },
            { language: 'te', name: 'ట్రాఫిక్ సిగ్నల్ సమస్య' },
            { language: 'ml', name: 'ട്രാഫിക് സിഗ്നൽ പ്രശ്നം' },
            { language: 'gu', name: 'ટ્રાફિક સિગ્નલની સમસ્યા' },
            { language: 'pa', name: 'ਟ੍ਰੈਫਿਕ ਸਿਗਨਲ ਦੀ ਸਮੱਸਿਆ' }
        ]
    },

    // Police Department
    {
        categoryId: 'police_theft',
        department: 'Police Department',
        translations: [
            { language: 'en', name: 'Theft complaint' },
            { language: 'kn', name: 'ಕಳ್ಳತನ ದೂರು' },
            { language: 'hi', name: 'चोरी की शिकायत' },
            { language: 'mr', name: 'चोरीची तक्रार' },
            { language: 'ta', name: 'திருட்டு புகார்' },
            { language: 'te', name: 'దొంగతనం ఫిర్యాదు' },
            { language: 'ml', name: 'മോഷണ പരാതി' },
            { language: 'gu', name: 'ચોરીની ફરિયાદ' },
            { language: 'pa', name: 'ਚੋਰੀ ਦੀ ਸ਼ਿਕਾਇਤ' }
        ]
    },
    {
        categoryId: 'police_safety',
        department: 'Police Department',
        translations: [
            { language: 'en', name: 'Safety issue' },
            { language: 'kn', name: 'ಸುರಕ್ಷತಾ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'सुरक्षा समस्या' },
            { language: 'mr', name: 'सुरक्षा समस्या' },
            { language: 'ta', name: 'பாதுகாப்பு பிரச்சனை' },
            { language: 'te', name: 'భద్రతా సమస్య' },
            { language: 'ml', name: 'സുരക്ഷാ പ്രശ്നം' },
            { language: 'gu', name: 'સુરક્ષા મુદ્દો' },
            { language: 'pa', name: 'ਸੁਰੱਖਿਆ ਮੁੱਦਾ' }
        ]
    },

    // Revenue Department
    {
        categoryId: 'rev_land_records',
        department: 'Revenue Department',
        translations: [
            { language: 'en', name: 'Land records issue' },
            { language: 'kn', name: 'ಭೂ ದಾಖಲೆಗಳ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'भूमि अभिलेख समस्या' },
            { language: 'mr', name: 'जमीन महसूल अभिलेख समस्या' },
            { language: 'ta', name: 'நில ஆவணங்கள் பிரச்சனை' },
            { language: 'te', name: 'భూమి రికార్డుల సమస్య' },
            { language: 'ml', name: 'ഭൂരേഖാ പ്രശ്നം' },
            { language: 'gu', name: 'જમીન રેકોર્ડ સમસ્યા' },
            { language: 'pa', name: 'ਜ਼ਮੀਨੀ ਰਿਕਾਰਡ ਦਾ ਮੁੱਦਾ' }
        ]
    },
    {
        categoryId: 'rev_property_dispute',
        department: 'Revenue Department',
        translations: [
            { language: 'en', name: 'Property dispute' },
            { language: 'kn', name: 'ಆಸ್ತಿ ವಿವಾದ' },
            { language: 'hi', name: 'संपत्ति विवाद' },
            { language: 'mr', name: 'मालमत्ता वाद' },
            { language: 'ta', name: 'சொத்து தகராறு' },
            { language: 'te', name: 'ఆస్తి వివాదం' },
            { language: 'ml', name: 'വസ്തു തർക്കം' },
            { language: 'gu', name: 'મિલકત વિવાદ' },
            { language: 'pa', name: 'ਜਾਇਦਾਦ ਦਾ ਵਿਵਾਦ' }
        ]
    },

    // Forest Department
    {
        categoryId: 'forest_tree_cutting',
        department: 'Forest Department',
        translations: [
            { language: 'en', name: 'Tree cutting complaint' },
            { language: 'kn', name: 'ಮರ ಕತ್ತರಿಸುವ ದೂರು' },
            { language: 'hi', name: 'पेड़ काटने की शिकायत' },
            { language: 'mr', name: 'वृक्षतोड तक्रार' },
            { language: 'ta', name: 'மரம் வெட்டுதல் புகார்' },
            { language: 'te', name: 'చెట్లు నరకడంపై ఫిర్యాదు' },
            { language: 'ml', name: 'മരം മുറിക്കൽ പരാതി' },
            { language: 'gu', name: 'વૃક્ષ કાપવાની ફરિયાદ' },
            { language: 'pa', name: 'ਦਰੱਖਤ ਕੱਟਣ ਦੀ ਸ਼ਿਕਾਇત' }
        ]
    },
    {
        categoryId: 'forest_wildlife',
        department: 'Forest Department',
        translations: [
            { language: 'en', name: 'Wildlife issue' },
            { language: 'kn', name: 'ವನ್ಯಜೀವಿ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'वन्यजीव समस्या' },
            { language: 'mr', name: 'वन्यजीव समस्या' },
            { language: 'ta', name: 'வனவிலங்கு பிரச்சனை' },
            { language: 'te', name: 'వన్యప్రాణుల సమస్య' },
            { language: 'ml', name: 'വന്യജീവി പ്രശ്നം' },
            { language: 'gu', name: 'વન્યજીવન સમસ્યા' },
            { language: 'pa', name: 'ਜੰਗਲੀ ਜੀਵ ਮੁੱਦਾ' }
        ]
    },

    // Social Welfare Department
    {
        categoryId: 'social_pension',
        department: 'Social Welfare Department',
        translations: [
            { language: 'en', name: 'Pension issue' },
            { language: 'kn', name: 'ಪಿಂಚಣಿ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'पेंशन समस्या' },
            { language: 'mr', name: 'निवृत्तीवेतन समस्या' },
            { language: 'ta', name: 'ஓய்வூதிய பிரச்சனை' },
            { language: 'te', name: 'పింఛను సమస్య' },
            { language: 'ml', name: 'പെൻഷൻ പ്രശ്നം' },
            { language: 'gu', name: 'પેન્શન સમસ્યા' },
            { language: 'pa', name: 'ਪੈਨਸ਼ਨ ਦਾ ਮੁੱਦਾ' }
        ]
    },
    {
        categoryId: 'social_scheme',
        department: 'Social Welfare Department',
        translations: [
            { language: 'en', name: 'Government scheme issue' },
            { language: 'kn', name: 'ಸರ್ಕಾರಿ ಯೋಜನೆ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'सरकारी योजना की समस्या' },
            { language: 'mr', name: 'सरकारी योजना समस्या' },
            { language: 'ta', name: 'அரசு திட்ட பிரச்சனை' },
            { language: 'te', name: 'ప్రభుత్వ పథకం సమస్య' },
            { language: 'ml', name: 'സർക്കാർ പദ്ധതി പ്രശ്നം' },
            { language: 'gu', name: 'સરકારી યોજનાની સમસ્યા' },
            { language: 'pa', name: 'ਸਰਕਾਰੀ ਸਕੀਮ ਦਾ ਮੁੱਦਾ' }
        ]
    },

    // General Department
    {
        categoryId: 'general_other',
        department: 'General Department',
        translations: [
            { language: 'en', name: 'Other uncategorized issue' },
            { language: 'kn', name: 'ಇತರ ವರ್ಗೀಕರಿಸದ ಸಮಸ್ಯೆ' },
            { language: 'hi', name: 'अन्य अवर्गीकृत समस्या' },
            { language: 'mr', name: 'इतर समस्या' },
            { language: 'ta', name: 'இதர பிரச்சனைகள்' },
            { language: 'te', name: 'ఇతర సమస్యలు' },
            { language: 'ml', name: 'മറ്റ് പരാതികൾ' },
            { language: 'gu', name: 'અન્ય સમસ્યાઓ' },
            { language: 'pa', name: 'ਹੋਰ ਮੁੱਦੇ' }
        ]
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await Category.deleteMany({});
        console.log('Cleared existing categories');

        for (const catData of categories) {
            await Category.create(catData);
            console.log(`Created Category: ${catData.categoryId}`);
        }

        console.log('Category Seeding completed for ALL 10 Support Languages.');
    } catch (err) {
        console.error('Error seeding categories:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
