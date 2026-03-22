# 🚛 Cargo Track: Smart Logistics & Security Ecosystem

**An ultra-secure, multi-layered cargo protection suite featuring real-time telemetry, AI anomaly detection, biometric-powered container locking, and blockchain-verified audit trails.**

---

## 🛑 The Challenge: Cargo Security & Theft
Logistics and high-value cargo transportation face critical risks:
- **Tampering & Theft:** 1.5M containers are tampered with annually.
- **Geofence Breaches:** Drivers going off-route for unauthorized activities.
- **Biometric Fraud:** Simple password-based unlocking systems are easily bypassed.
- **Lack of Auditing:** Centralized logs can be modified to hide theft.

## ✅ The Solution: Cargo Track
Cargo Track solves these issues through a unified ecosystem:
1.  **Driver Mobile App**: Enforces biometric verification (Fingerprint/FaceID) and constant telemetry pings.
2.  **Admin Command Center**: Real-time fleet monitoring, geofence configuration, and remote engine immobilization.
3.  **AI Guardian**: Evaluates every GPS ping to detect erratic behavior or route deviation using Isolation Forest models.
4.  **Blockchain Blackbox**: Every unlock, immobilize, and breach event is hashed and mined into a tamper-proof ledger.

---

## 🏗️ Technology Stack

### 📱 Mobile Application (`cargo-app/`)
- **Backend-as-a-Service**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tab & Stack)
- **Networking**: Axios / HTTP Service
- **Authentication**: Biometrics (Local Authentication) & SecureStore

### 💻 Admin Command Center (`iron-fist/frontend/`)
- **Framework**: React.js 18 (Vite)
- **Styling**: Apple SF-style Design Language, Framer Motion, Lucide
- **Charts/Maps**: Leaflet (ESRI Tiles), Recharts (Telemetry)
- **State Management**: React Context API

### ⚙️ Core Backend (`iron-fist/backend/`)
- **Runtime**: Node.js (Express)
- **Database**: MongoDB (Mongoose ODM)
- **Security**: JWT (HS256), BCrypt, CORS, Helmet
- **API Documentation**: Swagger (OpenAPI 3.0)

### 🤖 AI Anomaly Service (`iron-fist/ai-service/`)
- **Platform**: Python 3.9+ (FastAPI)
- **Machine Learning**: Scikit-Learn (Isolation Forest)
- **Data Processing**: Pandas, NumPy

### ⛓️ Blockchain Audit Service (`iron-fist/blockchain/`)
- **Protocol**: Ethereum (Solidity 0.8.x)
- **Development Tooling**: Hardhat, Ethers.js
- **Network**: Local EVM Node (Localhost:8545)

---

## 🚀 Setup & Installation

### 1️⃣ Repository Structure
```text
cargo-track/
├── cargo-app/      <-- Mobile App (Expo)
└── iron-fist/      <-- Web/Backend/AI/Blockchain
    ├── backend/    <-- API (Port 5000)
    ├── frontend/   <-- Dashboard (Port 3000)
    ├── blockchain/ <-- Smart Contracts
    └── ai-service/ <-- Python AI API
```

### 2️⃣ Prerequisites
- **Node.js**: v18+ 
- **Python**: 3.9+ 
- **MongoDB**: Running on `localhost:27017`

### 3️⃣ Quick Start Guide

**A. Start Blockchain Node (Terminal 1)**
```bash
cd iron-fist/blockchain
npm install && npx hardhat node
```

**B. Deploy Contracts (Terminal 2)**
```bash
cd iron-fist/blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**C. Start AI Service (Terminal 3)**
```bash
cd iron-fist/ai-service
python -m venv venv
# Activate venv: venv\Scripts\activate (Win) or source venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
uvicorn main:app --port 8000
```

**D. Start Backend & Seed Data (Terminal 4)**
```bash
cd iron-fist/backend
npm install
npm run dev
# Optional: Seed the database with the 5 drivers (Thamizh, Selvan, etc.)
node seed.js
```

**E. Start Console Dashboard (Terminal 5)**
```bash
cd iron-fist/frontend
npm install
npm run dev
```

**F. Run Mobile App (Terminal 6)**
```bash
cd cargo-app
npm install 
npx expo start
```

---

## 🛡️ Security Features
- **Biometric Gateway**: Containers can ONLY be unlocked if the driver provides a valid biometric signature AND the dispatcher approves remotely.
- **Engine Killswitch**: Dispatchers can remotely immobilize any vehicle engine in 1.4s if a geofence breach is detected.
- **Immutable Proofs**: All high-consequence actions generate a Blockchain hash proof visible in the Admin "Blockchain Audit" tab.

Developed as a modern, clean, and robust solution for the future of logistics security.
