import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import { connectToDatabase } from "../db/db.js";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Enhanced security middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Session configuration with MongoDB
const sessionConfig = {
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_NAME || 'toll-notification-system',
    collectionName: 'sessions',
    ttl: 30 * 24 * 60 * 60 // 30 days in seconds
  }),
  secret: process.env.SESSION_SECRET || 'toll_notify_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const { method, path, ip } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logMessage = `${method} ${path} ${res.statusCode} ${duration}ms - ${ip}`;
    
    if (path.startsWith("/api")) {
      log(logMessage);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Request Body:', req.body);
        console.log('Response:', res.locals.body);
      }
    }
  });

  next();
});

// Error handling wrapper
const startServer = async () => {
  try {
    // Database connection
    await connectToDatabase();
    log("✅ MongoDB connected successfully");

    // Route registration
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err, req, res, next) => {
      const status = err.status || 500;
      const message = process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Internal Server Error';
      
      if (status >= 500) {
        log(`❗ Server Error: ${err.stack || err.message}`);
      }

      res.status(status).json({ 
        status: 'error',
        message
      });
    });

    // Vite setup (development only)
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, server);
      log("🚀 Vite dev server enabled");
    } else {
      serveStatic(app);
      log("📦 Serving static production assets");
    }

    // Start server
  const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

  } catch (error) {
    log(`❌ Fatal startup error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

// Start the application
startServer();