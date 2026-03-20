import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env regardless of process working directory
dotenv.config({ path: path.join(__dirname, ".env") });

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import scriptRoutes from "./routes/scriptRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import searchRoutes from "./routes/search.js";
import aiRoutes from "./routes/aiRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import auditionRoutes from "./routes/auditionRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import creditsRoutes from "./routes/creditsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import scriptPitchRoutes from "./routes/scriptPitchRoutes.js";
connectDB().catch((error) => {
  console.error("Initial database connection failed:", error.message);
});

const app = express();
const isVercel = Boolean(process.env.VERCEL);

const localOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
];

const envOrigins = [process.env.CLIENT_URL, process.env.CORS_ORIGINS]
  .filter(Boolean)
  .flatMap((value) => String(value).split(","))
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...localOrigins, ...envOrigins])];

const corsOrigin = isVercel
  ? (origin, callback) => {
      // Allow same-origin/server-to-server/no-origin requests from Vercel platform.
      if (!origin) return callback(null, true);
      return callback(allowedOrigins.includes(origin) ? null : new Error("Not allowed by CORS"), allowedOrigins.includes(origin));
    }
  : allowedOrigins;

const createRealtimeServer = () => {
  const server = http.createServer(app);

  // Socket.IO runs only in long-lived Node server mode.
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    });

    socket.on("join-notifications", (userId) => {
      socket.join(`notifications-${userId}`);
      console.log(`User ${socket.id} joined notifications for: ${userId}`);
    });

    socket.on("send-message", (data) => {
      io.to(data.chatId).emit("receive-message", data);
    });

    socket.on("typing", (data) => {
      socket.to(data.chatId).emit("user-typing", data);
    });

    socket.on("smart-match-alert", (data) => {
      io.to(`notifications-${data.userId}`).emit("new-match", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return server;
};

// CORS Configuration - MUST be before routes
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/scripts", scriptRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/auditions", auditionRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/credits", creditsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/script-pitches", scriptPitchRoutes);

export default app;

if (!isVercel) {
  const server = createRealtimeServer();
  const PORT = process.env.PORT;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
