# Cargo Security Driver (Expo)

Driver mobile app for a cargo security demo:

- JWT login (`/api/auth/login`)
- Secure token storage (Expo SecureStore)
- Dashboard
  - Request Unlock (`/api/unlock/request`)
  - Unlock status (`/api/unlock/status`)
  - Vehicle status (`/api/vehicle/status`)
- GPS tracking: sends `{ latitude, longitude, ... }` to `/api/gps/update` every 5 seconds

## Setup

1) Install dependencies

```bash
npm install
```

2) Configure API URL

Create a `.env` file (copy from `.env.example`) and set:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_SERVER:PORT
```

3) Run

```bash
npm run android
```

## Folder structure

- `screens/` UI screens
- `services/` Axios + API calls
- `context/` Auth context (JWT + SecureStore)
- `theme/` Shared colors

