const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iron_fist';

/* ── Inline schemas (seed runs standalone, no server needed) ── */
const userSchema = new mongoose.Schema({
  name: String, email: String,
  password: { type: String, select: false },
  role: String, assignedContainerId: String,
  biometricId: String, faceEmbeddingId: String, isActive: Boolean,
});

const vehicleSchema = new mongoose.Schema({
  containerId: { type: String, unique: true },
  vehicleName: String, licensePlate: String,
  assignedDriverId: mongoose.Schema.Types.ObjectId,
  engineStatus: { type: String, default: 'STOPPED' },
  lockStatus:   { type: String, default: 'LOCKED'  },
  isActive:     { type: Boolean, default: true },
  lastLocation: { lat: Number, lng: Number, updatedAt: Date },
  requiresReauth: { type: Boolean, default: false },
  tamperDetected: { type: Boolean, default: false },
  jammingSuspected: { type: Boolean, default: false },
}, { timestamps: true });

const gpsSchema = new mongoose.Schema({
  driverId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  containerId:  { type: String, required: true },
  lat:          { type: Number, required: true },
  lng:          { type: Number, required: true },
  speed:        { type: Number, default: 0 },
  heading:      { type: Number, default: 0 },
  insideGeofence: { type: Boolean, default: true },
  anomalyStatus:  { type: String, enum: ['NORMAL','ANOMALY','UNKNOWN','PENDING','ERROR'], default: 'NORMAL' },
  anomalyDetails: { type: String, default: null },
  source: { type: String, default: 'MOBILE_APP' },
}, { timestamps: true });

const User        = mongoose.model('User',        userSchema);
const Vehicle     = mongoose.model('Vehicle',     vehicleSchema);
const GpsLocation = mongoose.model('GpsLocation', gpsSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to DB:', MONGODB_URI.split('@').pop());

    /* ── Wipe & reseed users ── */
    await User.deleteMany({});
    const salt = await bcrypt.genSalt(10);
    const hp   = await bcrypt.hash('password123', salt);

    const users = await User.insertMany([
      { name: 'Head Admin',   email: 'admin@ironfist.com',           password: hp, role: 'admin',      isActive: true },
      { name: 'Dispatcher',   email: 'dispatch1@ironfist.com',       password: hp, role: 'dispatcher', isActive: true },

      // ── The 5 requested drivers ──
      { name: 'Thamizh',   email: 'thamizh@ironfist.com',   password: hp, role: 'driver', assignedContainerId: 'C-8842', biometricId: 'FINGER_THAMIZH', faceEmbeddingId: 'FACE_THAMIZH', isActive: true },
      { name: 'Selvan',    email: 'selvan@ironfist.com',    password: hp, role: 'driver', assignedContainerId: 'C-109X', biometricId: 'FINGER_SELVAN',  faceEmbeddingId: 'FACE_SELVAN',  isActive: true },
      { name: 'Visvanth',  email: 'visvanth@ironfist.com',  password: hp, role: 'driver', assignedContainerId: 'C-38Z9', biometricId: 'FINGER_VISVANTH',faceEmbeddingId: 'FACE_VISVANTH',isActive: true },
      { name: 'Ram',       email: 'ram@ironfist.com',       password: hp, role: 'driver', assignedContainerId: 'C-99A1', biometricId: 'FINGER_RAM',     faceEmbeddingId: 'FACE_RAM',     isActive: true },
      { name: 'Hamilton',  email: 'hamilton@ironfist.com',  password: hp, role: 'driver', assignedContainerId: 'C-44B2', biometricId: 'FINGER_HAMILTON', faceEmbeddingId: 'FACE_HAMILTON',isActive: true },
    ]);
    console.log('✅ Users seeded:', users.map(u => u.email));

    const thamizh  = users.find(u => u.email === 'thamizh@ironfist.com')._id;
    const selvan   = users.find(u => u.email === 'selvan@ironfist.com')._id;
    const visvanth = users.find(u => u.email === 'visvanth@ironfist.com')._id;
    const ram      = users.find(u => u.email === 'ram@ironfist.com')._id;
    const hamilton = users.find(u => u.email === 'hamilton@ironfist.com')._id;

    /* ── Wipe & reseed vehicles ── */
    await Vehicle.deleteMany({});
    const vehicles = await Vehicle.insertMany([
      {
        containerId: 'C-8842', vehicleName: 'Tata Prima 4028.S',  licensePlate: 'TN-09-AB-1234',
        assignedDriverId: thamizh,  engineStatus: 'RUNNING', lockStatus: 'LOCKED',
        lastLocation: { lat: 13.0827, lng: 80.2707, updatedAt: new Date() }, // Chennai
      },
      {
        containerId: 'C-109X', vehicleName: 'Ashok Leyland 2518', licensePlate: 'MH-01-CD-5678',
        assignedDriverId: selvan,   engineStatus: 'RUNNING', lockStatus: 'UNLOCKED',
        lastLocation: { lat: 19.0760, lng: 72.8777, updatedAt: new Date() }, // Mumbai
      },
      {
        containerId: 'C-38Z9', vehicleName: 'BharatBenz 3523',    licensePlate: 'DL-05-EF-9012',
        assignedDriverId: visvanth, engineStatus: 'RUNNING', lockStatus: 'LOCKED',
        lastLocation: { lat: 28.7041, lng: 77.1025, updatedAt: new Date() }, // Delhi
      },
      {
        containerId: 'C-99A1', vehicleName: 'Eicher Pro 8031',    licensePlate: 'WB-06-GH-3456',
        assignedDriverId: ram,      engineStatus: 'RUNNING', lockStatus: 'LOCKED',
        lastLocation: { lat: 22.5726, lng: 88.3639, updatedAt: new Date() }, // Kolkata
      },
      {
        containerId: 'C-44B2', vehicleName: 'Mahindra Blazo X 40',licensePlate: 'KA-01-IJ-7890',
        assignedDriverId: hamilton, engineStatus: 'STOPPED', lockStatus: 'LOCKED',
        lastLocation: { lat: 12.9716, lng: 77.5946, updatedAt: new Date() }, // Bangalore
      },
    ]);
    console.log('✅ Vehicles seeded:', vehicles.map(v => v.containerId));

    /* ── Wipe & reseed GPS Locations ── */
    await GpsLocation.deleteMany({});
    const gpsData = await GpsLocation.insertMany([
      {
        driverId: thamizh,  containerId: 'C-8842',
        lat: 13.0827, lng: 80.2707, speed: 58, heading: 315,
        insideGeofence: true, anomalyStatus: 'NORMAL', source: 'MOBILE_APP',
      },
      {
        driverId: selvan,   containerId: 'C-109X',
        lat: 19.0760, lng: 72.8777, speed: 72, heading: 90,
        insideGeofence: false, anomalyStatus: 'ANOMALY',
        anomalyDetails: 'Vehicle appears stationary (speed=0.0 km/h); Location outside expected route corridor',
        source: 'MOBILE_APP',
      },
      {
        driverId: visvanth, containerId: 'C-38Z9',
        lat: 28.7041, lng: 77.1025, speed: 61, heading: 180,
        insideGeofence: true, anomalyStatus: 'NORMAL', source: 'MOBILE_APP',
      },
      {
        driverId: ram,      containerId: 'C-99A1',
        lat: 22.5726, lng: 88.3639, speed: 84, heading: 270,
        insideGeofence: true, anomalyStatus: 'NORMAL', source: 'MOBILE_APP',
      },
      {
        driverId: hamilton, containerId: 'C-44B2',
        lat: 12.9716, lng: 77.5946, speed: 0,  heading: 0,
        insideGeofence: true, anomalyStatus: 'NORMAL', source: 'MOBILE_APP',
      },
    ]);
    console.log('✅ GPS Locations seeded:', gpsData.map(g => g.containerId));

    console.log('\n── LOGIN CREDENTIALS ──────────────────────────────');
    console.log('Admin       : admin@ironfist.com        / password123');
    console.log('Dispatcher  : dispatch1@ironfist.com    / password123');
    console.log('Thamizh     : thamizh@ironfist.com     / password123  → C-8842 (Chennai → Delhi)');
    console.log('Selvan      : selvan@ironfist.com      / password123  → C-109X (Mumbai → Kolkata)');
    console.log('Visvanth    : visvanth@ironfist.com    / password123  → C-38Z9 (Delhi → Bangalore)');
    console.log('Ram         : ram@ironfist.com         / password123  → C-99A1 (Kolkata → Mumbai)');
    console.log('Hamilton    : hamilton@ironfist.com    / password123  → C-44B2 (Bangalore → Chennai)');
    console.log('───────────────────────────────────────────────────\n');

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
