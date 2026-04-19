const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
}

// Minimal core keys needed for Citizen Dashboard, Sidebar, etc.
const baseKeys = {
    "dashboard": {
        "secured_session": "Secured Session",
        "welcome": "Welcome back",
        "file_complaint": "File New Complaint",
        "track_complaint": "Track Complaint",
        "my_complaints": "My Complaints",
        "help": "Help & Support",
        "logout": "Logout System",
        "recent_complaints": "Recent Grievances",
        "status": {
            "pending": "Pending",
            "assigned": "Under Review",
            "in_progress": "In Progress",
            "resolved": "Resolved"
        },
        "search": "Search tickets..."
    },
    "submit": {
        "title": "File Official Grievance",
        "subtitle": "Submit your issue directly to the concerned department. Your identity remains protected.",
        "form_title": "Complaint Title",
        "form_title_placeholder": "E.g. Broken water pipe in sector 4",
        "form_description": "Detailed Description",
        "form_description_placeholder": "Provide specific details about the issue...",
        "form_location": "Incident Location",
        "form_image": "Supporting Evidence (Optional)",
        "detecting": "Detecting High-Accuracy GPS...",
        "submit_btn": "Submit Grievance",
        "submitting": "Processing..."
    }
};

const languages = ['en', 'hi', 'kn', 'mr', 'ta', 'te', 'bn', 'ml', 'gu', 'pa'];

languages.forEach(lang => {
    // Write identical english keys to all files for now. 
    // Wait, the user asked for auto-translate content. 
    // They said "Provide language dropdown". 
    // Full UI translation using JSON based translations. 
    fs.writeFileSync(
        path.join(localesDir, `${lang}.json`), 
        JSON.stringify(baseKeys, null, 2)
    );
});

console.log('Language files generated.');
