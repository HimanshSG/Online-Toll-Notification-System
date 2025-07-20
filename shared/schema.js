// server/schema.js

import mongoose from "mongoose";

// ====== USERS ======
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  fastagBalance: { type: Number, default: 0.0 },
  contactNumber: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  fastagId: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  lastKnownLatitude: { type: Number },
  lastKnownLongitude: { type: Number },
  lastLocationTimestamp: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  settings: {
    notificationsEnabled: { type: Boolean, default: true },
    proximityAlerts: { 
      enabled: { type: Boolean, default: true },
      sms: { type: Boolean, default: true } // SMS toggle for proximity
    },
    balanceAlerts: {
      enabled: { type: Boolean, default: true },
      sms: { type: Boolean, default: true }, // SMS toggle for balance
      threshold: { type: Number, default: 200 } // Move threshold here
    },
    locationTracking: { type: Boolean, default: true },
    smsAlertsEnabled: { type: Boolean, default: true } // Global SMS toggle
  },
  lastLogin: {
    type: Date,
    default: null
  },
  sessions: [{
    sessionId: String,
    createdAt: Date,
    expiresAt: Date
  }],
});

// ====== ADMINS ======
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ====== TOLL PLAZAS ======
const tollPlazaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roadName: { type: String, required: true },
  tollFee: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ====== NOTIFICATION LOGS ======
const notificationLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  tollPlazaId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "TollPlaza" 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['balance', 'proximity'] 
  },
  message: { 
    type: String, 
    required: true 
  },
  // Notification delivery status
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'sent', 'seen', 'failed'],
    default: 'pending' 
  },
  // SMS-specific tracking
  smsStatus: { 
    type: String, 
    enum: ['pending', 'sent', 'failed', 'disabled'],
    default: 'disabled' 
  },
  smsError: { 
    type: String 
  },
  retryCount: { 
    type: Number, 
    default: 0 
  },
  sentAt: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for faster queries
notificationLogSchema.index({ userId: 1 });
notificationLogSchema.index({ status: 1 });
notificationLogSchema.index({ smsStatus: 1 });
notificationLogSchema.index({ sentAt: -1 });
notificationLogSchema.index({ 
  userId: 1, 
  type: 1, 
  sentAt: -1 
});

// ====== OTP VERIFICATIONS ======
const otpVerificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', function(next) {
  if (this.isModified('contactNumber')) {
    // Ensure phone number starts with country code
    if (!this.contactNumber.startsWith('+')) {
      this.contactNumber = `+91${this.contactNumber.replace(/^0+/, '')}`;
    }
    // Remove all non-digit characters except +
    this.contactNumber = this.contactNumber.replace(/[^\d+]/g, '');
  }
  next();
});

// ====== MODELS ======
export const User = mongoose.model("User", userSchema);
export const Admin = mongoose.model("Admin", adminSchema);
export const TollPlaza = mongoose.model("TollPlaza", tollPlazaSchema);
export const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);
export const OtpVerification = mongoose.model("OtpVerification", otpVerificationSchema);
