from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
import os
app = Flask(__name__)
CORS(app)

# Global variables for model and vectorizer
model = None
vectorizer = None

def train_model():
    global model, vectorizer
    # Load data
    if os.path.exists('data.csv'):
        df = pd.read_csv('data.csv')
    else:
        # Fallback if file not found
        data = {
            'text': ['light not working', 'water leakage', 'road damage', 'garbage issues'],
            'category': ['Electricity', 'Water Supply', 'Infrastructure', 'Sanitation'],
            'priority': ['Medium', 'High', 'High', 'Medium']
        }
        df = pd.DataFrame(data)
    
    # Simple training
    vectorizer = TfidfVectorizer(stop_words='english')
    X = vectorizer.fit_transform(df['text'])
    
    # Train classification model
    model_cat = LogisticRegression()
    model_cat.fit(X, df['category'])
    
    # Train priority model (simpler version)
    model_prio = LogisticRegression()
    model_prio.fit(X, df['priority'])
    
    model = {'category': model_cat, 'priority': model_prio}
    print("AI Model Trained Successfully")

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        train_model()
    
    data = request.json
    text = data.get('text', '').lower().strip()
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    desc = data.get('description', '')
    
    # Basic cleaning
    clean_desc = desc.lower().strip()
    
    # Simple Priority Hint Logic
    priority = "Medium"
    if any(k in clean_desc for k in ["spark", "fire", "short circuit", "urgent", "danger", "burst", "flood"]):
        priority = "High"
    
    X_new = vectorizer.transform([clean_desc])
    category = model['category'].predict(X_new)[0]
    
    # Confidence (dummy for now)
    probs = model['category'].predict_proba(X_new)
    confidence = (max(probs[0]) * 100)
    
    return jsonify({
        'category': category,
        'priority': priority,
        'confidence': f"{confidence:.2f}%"
    })

if __name__ == '__main__':
    train_model()
    app.run(host='0.0.0.0', port=8000, debug=True)
