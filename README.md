# AI Public Grievance Auto-Classification System

A modern system to handle public grievances using AI for auto-classification and priority detection.

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **MongoDB** (Running locally on `mongodb://127.0.0.1:27017/pgrs`)

## Quick Start

The easiest way to run the entire project is using the `start.py` script in the root directory.

1.  **Start Services:**
    ```bash
    python start.py
    ```
    This script will:
    - Start the AI Classification Service (Python/Flask)
    - Start the Backend API (Node.js/Express)
    - Start the Frontend Dashboard (React/Vite)

2.  **Access the Application:**
    - **Frontend:** [http://localhost:5173](http://localhost:5173)
    - **Backend API:** [http://localhost:5000](http://localhost:5000)
    - **AI Model API:** [http://localhost:8000](http://localhost:8000)

### Accessing from Other Devices (LAN)

To access the dashboard from a phone or another laptop on the same Wi-Fi:
1.  Find your computer's IP address (Run `ipconfig` on Windows).
2.  Use the IP address instead of `localhost` in your browser:
    - **Frontend:** `http://<YOUR_IP>:5173`
    - **Example:** `http://192.168.1.5:5173`

## Manual Setup (If `start.py` fails)

### 1. AI Service
```bash
cd ai-model
# Create and activate virtual environment (optional but recommended)
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

### 2. Backend Server
```bash
cd server
npm install
npm run dev
```

### 3. Frontend Client
```bash
cd client
npm install
npm run dev
```
