// db/connect.js
import mongoose from "mongoose";

let retryTimer = null;
let isConnecting = false;
let listenersBound = false;

export async function connectWithRetry(mongoUri) {
  const uri = mongoUri || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Check your .env and dotenv config.");
  }

  const connect = async () => {
    if (isConnecting) return;
    isConnecting = true;

    // clear any scheduled retry before attempting
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
      });
      console.log("🗄️ Connected to MongoDB");
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err.message);

      // schedule ONE retry
      retryTimer = setTimeout(() => {
        isConnecting = false;
        connect();
      }, 5000);

      return;
    } finally {
      isConnecting = false;
    }

    // bind listeners once
    if (!listenersBound) {
      listenersBound = true;

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected. Retrying...");
        // schedule reconnect (single)
        if (!retryTimer) {
          retryTimer = setTimeout(connect, 2000);
        }
      });

      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB error:", err.message);
      });
    }
  };

  await connect();
}
