# 🛡️ Iron Fist: Smart Cargo Security Platform

A highly secure, scalable cargo security system featuring **Biometric Unlocking**, **Live GPS Tracking & Geofencing**, **AI Anomaly Detection**, **Remote Immobilization**, and **Blockchain Tamper-Proof Audit Logging**.

## 🏗️ System Architecture

1. **Backend**: Node.js, Express, MongoDB
2. **AI Microservice**: Python, FastAPI, Scikit-learn (Isolation Forest)
3. **Blockchain**: Hardhat, Solidity (Local / Testnet deployment)
4. **Dispatcher Web Dashboard**: React, Vite, Tailwind CSS, Framer Motion, Leaflet
5. **Driver Mobile App**: React Native (Expo), Biometric Auth, Background Location

---

## 🚀 Setup & Execution Instructions

Follow these instructions exactly to spin up the entire microservice ecosystem locally.

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- MongoDB (running locally on port 27017)
- Git (optional)

### 1️⃣ Database Setup
Ensure MongoDB is running locally on the default port `27017`.
- The backend config expects `mongodb://localhost:27017/iron_fist`.

### 2️⃣ Start Blockchain Service (Terminal 1)
To ensure logs are completely tamper-proof, we use a local Hardhat Ethereum node.
```bash
cd blockchain
npm install
# Start local blockchain node
npx hardhat node
```

### 3️⃣ Deploy Smart Contract (Terminal 2)
Keep Terminal 1 running. In a new terminal, deploy the logger contract to your local chain.
```bash
cd blockchain
# Deploy to local node
npx hardhat run scripts/deploy.js --network localhost
```
*Note: This command generates a `deployments/localhost.json` file. The output will also tell you the `CONTRACT_ADDRESS`. By default, the Backend `.env.example` already contains the default Hardhat address and deployer key.*

### 4️⃣ Start AI Microservice (Terminal 3)
The AI microservice performs anomaly detection on GPS data using Scikit-Learn.
```bash
cd ai-service
# Create virtual environment
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000
```
*(The AI will auto-train a baseline Isolation Forest model on first boot).*

### 5️⃣ Start Backend API (Terminal 4)
```bash
cd backend
npm install

# The prompt already created a `.env` file from `.env.example`.
# If you changed the local mongodb port/URI or contract address, update it in `.env`.

# Start the dev server
npm run dev
```
*The server will run on `http://localhost:5000`.*
*Swagger API Docs available at `http://localhost:5000/api/docs`.*

### 6️⃣ Start Web Dashboard (Terminal 5)
```bash
cd frontend
npm install
# Boot up the dispatcher command center
npm run dev
```
*Access the Web UI at `http://localhost:3000`.*

### 7️⃣ Start Mobile App (Terminal 6)
```bash
cd mobile
npm install

# CRITICAL STEP FOR MOBILE TESTING:
# Open `mobile/src/services/api.js` and change `API_URL` to your computer's local IP address (e.g., `http://192.168.1.15:5000/api`), NOT localhost.
# Emulators cannot reach your machine's localhost directly using the word 'localhost'.

# Run Expo
npx expo start
```
*Press `a` to run passing Android emulator or use the Expo Go app on your physical phone by scanning the QR code.*

---

## 🧪 Testing the Flow

1. **System Seeding**: Using Postman or the Swagger Docs (`http://localhost:5000/api/docs`), hit the `POST /auth/register` endpoint to create an `admin` user, and another to create a `driver` user.
2. **Access Command Center**: Open the Web UI and login as the `admin` or `dispatcher`.
3. **Access Mobile App**: Login to the mobile app as the `driver`.
4. **GPS Tracking**: On the mobile app, toggle "Telemetry Link". The app will request location permissions and begin pinging the API.
   - The AI API will transparently evaluate this telemetry. If you drive outside the geofence or have an erratic speed pattern, the Web UI will glow red with an alert.
5. **Unlock Request**: Click "REQUEST UNLOCK" in the app. It will trigger simulated (or real, if on a physical phone) biometric authentication.
   - It sends the request to the dispatcher.
6. **Approval**: On the Web Dashboard, go to "Unlock Requests" and click "Approve".
   - The mobile UI will dynamically update to show an **UNLOCKED** container via a polling mechanism!
7. **Immobilization**: On the Web UI, go to the "Command Center" tab, and under "Active Fleet Control", click **KILL ENGINE**.
8. **Blockchain Validation**: Every single event (Geofence Breach, Unlock approved, Immobilized, Login) has its SHA-256 hash transparently mined onto the local Hardhat Node.

---

### Developed using clean MVC architecture, RESTful endpoints, and ultra-premium modern React/Motion interfaces.
