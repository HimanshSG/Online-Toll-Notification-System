import mongoose from "mongoose";

const uri = "mongodb+srv://HIMANSH:HIMANSH@cluster0.rdlyegb.mongodb.net/toll-notification-system?retryWrites=true&w=majority&appName=Cluster0";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return mongoose.connection; // ✅ return connection if already connected
  }

  try {
    await mongoose.connect(uri, {
      dbName: "toll-notification-system",
      serverSelectionTimeoutMS: 5000,   // 5 seconds
      socketTimeoutMS: 45000,            // 45 seconds
    });

    isConnected = true;
    console.log("✅ MongoDB connected successfully");

    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose connected to DB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    return mongoose.connection; // ✅ important: return the connection here
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}
