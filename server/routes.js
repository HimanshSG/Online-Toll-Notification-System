import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import session from "express-session";
import { WebSocketServer } from "ws";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import {
  User,
  Admin,
  TollPlaza,
  NotificationLog,
  OtpVerification,
} from "../shared/schema.js";
import { generateOTP, calculateDistance } from "./storage.js";
import { setupNotificationService } from "./notificationService.js";
import twilio from 'twilio';


const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const PROXIMITY_THRESHOLD_KM = 2;
const LOW_BALANCE_THRESHOLD = 200;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER

const twilioClient = twilio(accountSid, authToken);


// Utility function to send OTP via SMS
async function sendOtpSms(phoneNumber, otp) {
  try {
    let normalizedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      normalizedPhone = `+91${phoneNumber}`;
    }

    await twilioClient.messages.create({
      body: `Your TollNotify verification code is: ${otp}`,
      from: twilioPhone,
      to: normalizedPhone,
    });
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    throw new Error("Failed to send OTP SMS.");
  }
}


export async function registerRoutes(app) {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const { sendNotification, checkProximityAlerts } = setupNotificationService(wss);
  const clients = new Map();

  // WebSocket connection
  wss.on("connection", (ws) => {
    let userId;

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "authenticate") {
          userId = data.userId;
          clients.set(userId, ws);
          console.log(`Client connected: User ${userId}`);
        } else if (data.type === "locationUpdate") {
          const { userId, latitude, longitude } = data;
          if (userId) {
            await User.findByIdAndUpdate(userId, {
              $set: {
                lastKnownLatitude: latitude,
                lastKnownLongitude: longitude,
                lastLocationTimestamp: new Date(),
              },
            });
            await checkProximityAlerts(userId, latitude, longitude);
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
        console.log(`Client disconnected: User ${userId}`);
      }
    });
  });

  // =======================
  //  Authentication Routes
  // =======================

  // 1️⃣ Registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const userData = req.body;
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const newUser = await User.create({
      ...userData,
      passwordHash,
      fastagBalance: userData.fastagBalance || 0,
      isVerified: false, // ✅ Ensure default is false
    });

    const otp = generateOTP();

    await OtpVerification.create({
      userId: newUser._id,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes validity
    });

    await sendOtpSms(userData.contactNumber, otp); // ✅

    return res.status(201).json({
      user: newUser.toObject({ virtuals: true }),
      message: "User registered successfully. Verification OTP sent.",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 2️⃣ Verify OTP API
// 2️⃣ Verify OTP API (Fixed Version)
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const verification = await OtpVerification.findOne({
      userId,
      otp,
      expiresAt: { $gt: new Date() },
      isVerified: false,
    });

    if (!verification) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Update database records
    await Promise.all([
      OtpVerification.findByIdAndUpdate(verification._id, { isVerified: true }),
      User.findByIdAndUpdate(userId, { isVerified: true }),
    ]);
    
    return res.status(200).json({ 
      message: "OTP verified successfully"
    });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ 
      error: error.message || "Internal server error" 
    });
  }
});

// 3️⃣ Resend OTP API
app.post("/api/auth/resend-otp", async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = generateOTP();

    await OtpVerification.create({
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpSms(user.contactNumber, otp); // ✅

    return res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// =======================
  // Forgot Password Route
  // =======================
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { contactNumber } = req.body;

    const user = await User.findOne({ contactNumber });
    if (!user) {
      return res.status(404).json({ error: "User with this phone number not found" });
    }

    const otp = generateOTP();

    await OtpVerification.create({
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpSms(contactNumber, otp);

    return res.status(200).json({ message: "OTP sent for password reset", userId: user._id });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// =======================
  // Reset Password Route
  // =======================
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { userId, newPassword, otp } = req.body;  // Added OTP to request body

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otpRecord = await OtpVerification.findOne({
      userId,
      otp,
      isVerified: false,  // Check if OTP is not already verified
      expiresAt: { $gt: new Date() },  // Check if OTP has not expired
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark OTP as verified
    await OtpVerification.findByIdAndUpdate(otpRecord._id, { isVerified: true });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update the user's password
    await User.findByIdAndUpdate(userId, { passwordHash: hashedPassword });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});



// 4️⃣ Login API
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // ✅ ADD: Block login if not verified
    if (!user.isVerified) {
      return res.status(401).json({ error: "Please verify your account first." });
    }

    req.session.userId = user._id;
    req.session.userEmail = user.email;
    req.session.isAdmin = false;

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      fastagBalance: user.fastagBalance,
      fastagId: user.fastagId,
      vehicleNumber: user.vehicleNumber,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


  app.post("/api/auth/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await Admin.findOne({ email });

      if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }

      req.session.userId = admin._id;
      req.session.userEmail = admin.email;
      req.session.isAdmin = true;

      return res.status(200).json({
        id: admin._id,
        name: admin.name,
        email: admin.email
      });
    } catch (error) {
      console.error("Error logging in admin:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Failed to logout" });
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // User Routes
  app.get("/api/users/profile", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  
    try {
      const user = await User.findById(req.session.userId)
        .select("-passwordHash -__v -settings._id"); // Include settings
      
      if (!user) return res.status(404).json({ error: "User not found" });
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/profile", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  
    try {
      const updateData = {
        name: req.body.name,
        contactNumber: req.body.contactNumber,
        vehicleNumber: req.body.vehicleNumber
      };
  
      const updatedUser = await User.findByIdAndUpdate(
        req.session.userId,
        { $set: updateData },
        { 
          new: true,
          runValidators: true, // Enables phone number validation
          select: "-passwordHash -__v -settings._id" 
        }
      );
  
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      const errorMessage = error.name === 'ValidationError' 
        ? "Invalid phone number format. Use country code (+91...)" 
        : "Internal server error";
      res.status(400).json({ error: errorMessage });
    }
  });

  app.put("/api/users/location", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      await User.findByIdAndUpdate(req.session.userId, {
        $set: {
          lastKnownLatitude: latitude,
          lastKnownLongitude: longitude,
          lastLocationTimestamp: new Date()
        }
      });

      await checkProximityAlerts(req.session.userId, latitude, longitude);
      // res.status(200).json({ message: "Location updated successfully" });
    } catch (error) {
      console.error("Error updating user location:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user notifications
app.get("/api/users/notifications", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const notifications = await NotificationLog.find({ userId: req.session.userId })
      .sort("-sentAt")
      .limit(20)
      .populate("tollPlazaId", "name roadName tollFee latitude longitude");

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔥 Clear all user notifications
app.delete("/api/users/notifications", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await NotificationLog.deleteMany({ userId: req.session.userId });
    res.status(200).json({ message: "Notifications cleared successfully" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});
app.get("/api/users/settings/notifications", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await User.findById(req.session.userId)
      .select("settings")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user.settings || {});
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});


app.put("/api/users/settings/notifications", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const update = {
      'settings.notificationsEnabled': req.body.notificationsEnabled,
      'settings.proximityAlerts.enabled': req.body.proximityAlerts?.enabled,
      'settings.proximityAlerts.sms': req.body.proximityAlerts?.sms,
      'settings.balanceAlerts.enabled': req.body.balanceAlerts?.enabled,
      'settings.balanceAlerts.sms': req.body.balanceAlerts?.sms,
      'settings.balanceAlerts.threshold': req.body.balanceAlerts?.threshold,
      'settings.smsAlertsEnabled': req.body.smsAlertsEnabled,
      'settings.locationTracking': req.body.locationTracking
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      { $set: update },
      { 
        new: true,
        select: "settings", 
        runValidators: true 
      }
    );

    res.status(200).json(updatedUser.settings);
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(400).json({ 
      error: error.name === 'ValidationError' 
        ? "Invalid threshold value" 
        : "Failed to update settings" 
    });
  }
});


app.put("/api/users/recharge", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid recharge amount" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.fastagBalance += amount;
    user.updatedAt = new Date();
    await user.save();

    // Use dynamic threshold from settings
    if (user.fastagBalance < user.settings.balanceAlerts.threshold) {
      await sendNotification({
        userId: user._id,
        type: "balance",
        message: `Balance still low: ₹${user.fastagBalance} (Threshold: ₹${user.settings.balanceAlerts.threshold})`,
      });
    }

    res.status(200).json({
      message: "Recharge successful",
      fastagBalance: user.fastagBalance
    });
  } catch (error) {
    console.error("Error recharging balance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

  // Toll Plaza Routes
  app.get("/api/toll-plazas", async (req, res) => {
    try {
      const tollPlazas = await TollPlaza.find().sort("name");
      res.status(200).json(tollPlazas);
    } catch (error) {
      console.error("Error fetching toll plazas:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/toll-plazas/nearby", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { latitude, longitude, radius = 50 } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const tollPlazas = await TollPlaza.find();
      const nearbyTolls = tollPlazas
        .map(plaza => ({
          ...plaza.toObject(),
          distance: calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            plaza.latitude,
            plaza.longitude
          )
        }))
        .filter(plaza => plaza.distance <= parseFloat(radius))
        .sort((a, b) => a.distance - b.distance);

      res.status(200).json(nearbyTolls);
    } catch (error) {
      console.error("Error fetching nearby toll plazas:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get('/api/users/settings', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  
    try {
      const user = await User.findById(req.session.userId)
        .select('settings');
      res.status(200).json(user.settings || {});
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post('/api/users/settings', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  
    try {
      await User.findByIdAndUpdate(req.session.userId, {
        $set: { settings: req.body }
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error saving user settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Routes
  app.get("/api/admin/dashboard/toll-plazas", async (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { page = 1, limit = 10, search = "", sortBy = "name", sortOrder = "asc" } = req.query;
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
      const query = search ? {
        $or: [
          { name: new RegExp(search, "i") },
          { roadName: new RegExp(search, "i") }
        ]
      } : {};

      const [tollPlazas, total] = await Promise.all([
        TollPlaza.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        TollPlaza.countDocuments(query)
      ]);

      res.status(200).json({
        data: tollPlazas,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching toll plazas for admin:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/dashboard/toll-plazas", async (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized" });

    try {
      const newToll = await TollPlaza.create(req.body);
      res.status(201).json(newToll);
    } catch (error) {
      console.error("Error creating toll plaza:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/dashboard/toll-plazas/:id", async (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized" });

    try {
      const updatedToll = await TollPlaza.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedToll) return res.status(404).json({ error: "Toll plaza not found" });
      res.status(200).json(updatedToll);
    } catch (error) {
      console.error("Error updating toll plaza:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

  app.delete("/api/admin/dashboard/toll-plazas/:id", async (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized" });

    try {
      const toll = await TollPlaza.findByIdAndDelete(req.params.id);
      if (!toll) return res.status(404).json({ error: "Toll plaza not found" });
      res.status(200).json({ message: "Toll plaza deleted successfully" });
    } catch (error) {
      console.error("Error deleting toll plaza:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/dashboard/users", async (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = "", 
        sortBy = "name", 
        sortOrder = "asc",
        filter 
      } = req.query;
  
      const skip = (Number(page) - 1) * Number(limit);
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
      
      let query = {};
  
      // Handle search term
      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { fastagId: new RegExp(search, "i") },
          { vehicleNumber: new RegExp(search, "i") }
        ];
      }
  
      // Handle filter
      if (filter) {
        switch(filter) {
          case 'Low Balance':
            query.fastagBalance = { $lt: 200 };
            break;
          case 'Active Users':
            query.fastagBalance = { $gte: 200 };
            break;
          // 'Recently Added' handled via sort
        }
      }
  
      const [users, total] = await Promise.all([
        User.find(query)
          .select("-passwordHash -__v")
          .sort(sort)
          .skip(skip)
          .limit(Number(limit)),
        User.countDocuments(query)
      ]);
  
      res.status(200).json({
        data: users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/dashboard/users/:id/balance", async (req, res) => {
    try {
      // 1. Enhanced authorization check
      if (!req.session.isAdmin) {
        console.warn('Unauthorized balance update attempt:', {
          userId: req.session.userId,
          params: req.params
        });
        return res.status(401).json({ 
          error: "Unauthorized: Admin privileges required" 
        });
      }
  
      // 2. Input validation
      if (typeof req.body.fastagBalance !== 'number' || isNaN(req.body.fastagBalance)) {
        console.error('Invalid balance input:', req.body);
        return res.status(400).json({ 
          error: "Invalid balance value: Must be a valid number" 
        });
      }
  
      // 3. Convert ID to ObjectId for better error handling
      let userId;
      try {
        userId = new mongoose.Types.ObjectId(req.params.id);
      } catch (error) {
        console.error('Invalid user ID format:', req.params.id);
        return res.status(400).json({ 
          error: "Invalid user ID format" 
        });
      }
  
      // 4. Update operation with error handling
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { fastagBalance: req.body.fastagBalance } },
        { 
          new: true,
          runValidators: true // Ensure schema validations run
        }
      ).select('-passwordHash -__v'); // Exclude sensitive fields
  
      if (!user) {
        console.error('User not found with ID:', req.params.id);
        return res.status(404).json({ 
          error: "User not found" 
        });
      }
  
      // 5. Handle notification asynchronously
      if (user.fastagBalance < LOW_BALANCE_THRESHOLD) {
        sendNotification({
          userId: user._id,
          type: "balance",
          message: `Your FASTag balance is low. Current balance: ₹${user.fastagBalance}`,
          status: "sent"
        }).catch(notificationError => {
          console.error('Notification failed:', notificationError);
          // Don't fail the main request for notification errors
        });
      }
  
      // 6. Successful response
      console.log('Balance updated successfully for user:', user._id);
      res.status(200).json({
        success: true,
        message: "Balance updated successfully",
        user: {
          id: user._id,
          fastagId: user.fastagId,
          balance: user.fastagBalance
        }
      });
  
    } catch (error) {
      // 7. Detailed error handling
      console.error("Balance update error:", {
        error: error.message,
        params: req.params,
        body: req.body,
        stack: error.stack
      });
  
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      const errorMessage = error.name === 'ValidationError' 
        ? error.message 
        : "Failed to update balance. Please try again.";
  
      res.status(statusCode).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/dashboard/notifications", async (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { page = 1, limit = 10, type } = req.query;
      const query = type && type !== "all" ? { type } : {};
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        NotificationLog.find(query)
          .sort("-sentAt")
          .skip(skip)
          .limit(limit)
          .populate("userId", "name email")
          .populate("tollPlazaId"),
        NotificationLog.countDocuments(query)
      ]);

      res.status(200).json({
        data: notifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching notifications for admin:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/dashboard/stats", async (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized" });

    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const [usersCount, activeSessionsCount, notificationsCount, tollPlazasCount] =
        await Promise.all([
          User.countDocuments(),
          User.countDocuments({ lastLocationTimestamp: { $gt: thirtyMinutesAgo } }),
          NotificationLog.countDocuments(),
          TollPlaza.countDocuments()
        ]);

      const recentNotifications = await NotificationLog.find()
        .sort("-sentAt")
        .limit(5)
        .populate("userId", "name email")
        .populate("tollPlazaId");

      res.status(200).json({
        usersCount,
        activeSessionsCount,
        notificationsCount,
        tollPlazasCount,
        recentNotifications
      });
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
// Add this POST endpoint